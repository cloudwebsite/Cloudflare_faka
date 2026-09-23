import { eq } from "drizzle-orm";
import { createDrizzleDb } from "@/database/drizzle";
import { order, pushChannelConfig, telegramSupportConfig, telegramSupportSession } from "@/database/drizzle/schema";
import { reportUnexpectedServerError } from "@/server/error-handling";
import { getEnabledPaymentProviders } from "@/server/payment/config";
import { getOrderForQuery } from "@/server/order/service";
import { getSiteSettings } from "@/server/site/public-settings";
import { parseTelegramProviderConfig } from "@/server/push/telegram-provider";
import { parseTelegramSupportConfig, type TelegramSupportConfig, type TelegramSupportSessionState } from "./config";

const SESSION_TTL_MS = 30 * 60 * 1000;
const QUERY_LIMIT = 5;
const FORWARD_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const TG_TEXT_LIMIT = 4096;

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number; type?: string };
    from?: { id?: number; username?: string; first_name?: string; is_bot?: boolean };
  };
  callback_query?: {
    id?: string;
    data?: string;
    message?: { chat?: { id?: number }; message_id?: number };
    from?: { id?: number; username?: string; first_name?: string; is_bot?: boolean };
  };
};

type RateBucket = { count: number; resetAt: number };
const queryRate = new Map<string, RateBucket>();
const forwardRate = new Map<string, RateBucket>();

function timingSafeEqual(left: string, right: string) {
  const a = new TextEncoder().encode(left);
  const b = new TextEncoder().encode(right);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i]! ^ b[i]!;
  return diff === 0;
}

function takeRate(map: Map<string, RateBucket>, key: string, limit: number) {
  const now = Date.now();
  const current = map.get(key);
  if (!current || current.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

async function telegramApi(token: string, method: string, body: Record<string, unknown>) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const json = await response.json() as { ok?: boolean; description?: string };
  if (!response.ok || json.ok !== true) throw new Error(json.description || "TELEGRAM_SEND_FAILED");
}

function mainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "查询订单", callback_data: "support:query" }],
      [{ text: "购买流程", callback_data: "support:buy" }],
      [{ text: "支付方式", callback_data: "support:pay" }],
      [{ text: "人工客服", callback_data: "support:human" }],
    ],
  };
}

function truncate(text: string, max = TG_TEXT_LIMIT) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 20)}\n…(内容已截断，请以网站订单页为准)`;
}

async function loadConfig(database: D1Database): Promise<{ enabled: boolean; config: TelegramSupportConfig } | null> {
  const db = createDrizzleDb(database);
  const [record] = await db.select().from(telegramSupportConfig).where(eq(telegramSupportConfig.id, 1)).limit(1);
  if (!record) return null;
  try {
    return { enabled: record.isEnabled, config: parseTelegramSupportConfig(record.configJson) };
  } catch {
    return null;
  }
}

async function resolveAdminChatId(database: D1Database, config: TelegramSupportConfig) {
  if (config.adminChatId) return config.adminChatId;
  const db = createDrizzleDb(database);
  const [push] = await db.select({ isEnabled: pushChannelConfig.isEnabled, configJson: pushChannelConfig.configJson })
    .from(pushChannelConfig)
    .where(eq(pushChannelConfig.channel, "TELEGRAM"))
    .limit(1);
  if (!push?.isEnabled) return null;
  try {
    return parseTelegramProviderConfig(push.configJson).chatId;
  } catch {
    return null;
  }
}

async function getSession(database: D1Database, chatId: string) {
  const db = createDrizzleDb(database);
  const [row] = await db.select().from(telegramSupportSession).where(eq(telegramSupportSession.chatId, chatId)).limit(1);
  if (!row) return { state: "idle" as const, pendingOrderNo: null as string | null };
  const stale = Date.now() - row.updatedAt.getTime() > SESSION_TTL_MS;
  if (stale && (row.state === "await_order" || row.state === "await_email")) {
    return { state: "idle" as const, pendingOrderNo: null as string | null };
  }
  return { state: row.state as TelegramSupportSessionState, pendingOrderNo: row.pendingOrderNo };
}

async function setSession(database: D1Database, chatId: string, state: TelegramSupportSessionState, pendingOrderNo: string | null = null) {
  const db = createDrizzleDb(database);
  const now = new Date();
  await db.insert(telegramSupportSession).values({ chatId, state, pendingOrderNo, updatedAt: now })
    .onConflictDoUpdate({ target: telegramSupportSession.chatId, set: { state, pendingOrderNo, updatedAt: now } });
}

async function classifyOrder(database: D1Database, orderNo: string) {
  const db = createDrizzleDb(database);
  const [row] = await db.select({ ownerUserId: order.ownerUserId }).from(order).where(eq(order.orderNo, orderNo.trim())).limit(1);
  if (!row) return { kind: "missing" as const };
  if (row.ownerUserId) return { kind: "account" as const };
  return { kind: "guest" as const };
}

async function replyOrderLookup(database: D1Database, token: string, chatId: string, orderNo: string, email: string) {
  const queried = await getOrderForQuery(database, orderNo, null, email);
  if (!queried) {
    await telegramApi(token, "sendMessage", { chat_id: chatId, text: "未找到匹配的订单。请确认订单号与下单邮箱后重试。" });
    return;
  }
  const lines = [
    `订单号：${queried.orderNo}`,
    `商品：${queried.productName}`,
    `数量：${queried.quantity}`,
    `金额：¥${queried.amount}`,
    `状态：${queried.status}`,
    `支付：${queried.paymentStatus}`,
    `发货：${queried.deliveryStatus}`,
  ];
  if (queried.deliveries.length > 0) {
    lines.push("", "发货内容：", ...queried.deliveries);
    lines.push("", "完整内容以网站订单页为准。");
  }
  await telegramApi(token, "sendMessage", { chat_id: chatId, text: truncate(lines.join("\n")) });
}

async function sendMenu(token: string, chatId: string, text: string) {
  await telegramApi(token, "sendMessage", { chat_id: chatId, text, reply_markup: mainKeyboard() });
}

async function handleStart(database: D1Database, token: string, chatId: string, config: TelegramSupportConfig) {
  await setSession(database, chatId, "idle");
  const site = await getSiteSettings(database);
  const welcome = config.welcomeMessage?.trim() || `欢迎使用 ${site.siteName} 客服机器人。请选择下方菜单。`;
  await sendMenu(token, chatId, welcome);
}

async function handleBuy(database: D1Database, token: string, chatId: string) {
  const site = await getSiteSettings(database);
  const url = site.siteUrl?.trim() || "";
  const text = [
    `购买流程（${site.siteName}）`,
    "1. 打开网站选择商品",
    "2. 填写联系方式并选择支付方式",
    "3. 完成支付后在订单页查看发货内容",
    url ? `网站：${url}` : "请在后台站点配置中填写网站地址。",
  ].join("\n");
  await sendMenu(token, chatId, text);
}

async function handlePay(database: D1Database, token: string, chatId: string) {
  const providers = await getEnabledPaymentProviders(database);
  const names = providers.map((item) => item.name);
  const text = names.length
    ? `当前可用支付方式：\n${names.map((name) => `· ${name}`).join("\n")}`
    : "当前暂无已启用的支付方式，请稍后再试或联系人工客服。";
  await sendMenu(token, chatId, text);
}

async function beginQuery(database: D1Database, token: string, chatId: string) {
  await setSession(database, chatId, "await_order");
  await telegramApi(token, "sendMessage", { chat_id: chatId, text: "请发送订单号（可直接发送，或使用 /order 订单号）。" });
}

async function beginHuman(database: D1Database, token: string, chatId: string, config: TelegramSupportConfig, fromLabel: string) {
  await setSession(database, chatId, "human");
  const adminChatId = await resolveAdminChatId(database, config);
  if (adminChatId) {
    await telegramApi(token, "sendMessage", {
      chat_id: adminChatId,
      text: truncate(`【人工客服接入】\n用户：${fromLabel}\nChat ID：${chatId}\n已进入人工模式，后续消息将转发到此。`),
    });
  }
  await telegramApi(token, "sendMessage", { chat_id: chatId, text: "已转给客服，请直接发送您的问题。发送 /start 可返回菜单。" });
}

async function processOrderNo(database: D1Database, token: string, chatId: string, orderNo: string) {
  if (!takeRate(queryRate, chatId, QUERY_LIMIT)) {
    await telegramApi(token, "sendMessage", { chat_id: chatId, text: "请稍后再试。" });
    return;
  }
  const classified = await classifyOrder(database, orderNo);
  if (classified.kind === "missing") {
    await setSession(database, chatId, "idle");
    await telegramApi(token, "sendMessage", { chat_id: chatId, text: "未找到该订单。发送 /start 返回菜单。" });
    return;
  }
  if (classified.kind === "account") {
    await setSession(database, chatId, "idle");
    await telegramApi(token, "sendMessage", { chat_id: chatId, text: "这是账户订单，请登录网站查看，机器人无法验证登录身份。" });
    return;
  }
  await setSession(database, chatId, "await_email", orderNo.trim());
  await telegramApi(token, "sendMessage", { chat_id: chatId, text: "请发送下单时填写的邮箱。" });
}

async function handleText(database: D1Database, token: string, chatId: string, config: TelegramSupportConfig, text: string, fromLabel: string) {
  const trimmed = text.trim();
  if (trimmed === "/start" || trimmed.startsWith("/start ")) {
    await handleStart(database, token, chatId, config);
    return;
  }
  if (trimmed === "/order" || trimmed.startsWith("/order ")) {
    const orderNo = trimmed.slice(6).trim();
    if (!orderNo) {
      await beginQuery(database, token, chatId);
      return;
    }
    await processOrderNo(database, token, chatId, orderNo);
    return;
  }

  const session = await getSession(database, chatId);
  if (session.state === "await_order") {
    await processOrderNo(database, token, chatId, trimmed);
    return;
  }
  if (session.state === "await_email") {
    if (!takeRate(queryRate, chatId, QUERY_LIMIT)) {
      await telegramApi(token, "sendMessage", { chat_id: chatId, text: "请稍后再试。" });
      return;
    }
    const orderNo = session.pendingOrderNo;
    if (!orderNo) {
      await setSession(database, chatId, "idle");
      await telegramApi(token, "sendMessage", { chat_id: chatId, text: "会话已过期，请重新查询订单。" });
      return;
    }
    await replyOrderLookup(database, token, chatId, orderNo, trimmed);
    await setSession(database, chatId, "idle");
    return;
  }
  if (session.state === "human") {
    if (!takeRate(forwardRate, chatId, FORWARD_LIMIT)) {
      await telegramApi(token, "sendMessage", { chat_id: chatId, text: "请稍后再试。" });
      return;
    }
    const adminChatId = await resolveAdminChatId(database, config);
    if (!adminChatId) {
      await telegramApi(token, "sendMessage", { chat_id: chatId, text: "客服暂不可用，请稍后再试。" });
      return;
    }
    if (String(adminChatId) === chatId) return;
    const body = trimmed.slice(0, 1000);
    await telegramApi(token, "sendMessage", {
      chat_id: adminChatId,
      text: truncate(`【顾客消息】\n用户：${fromLabel}\nChat ID：${chatId}\n\n${body}`),
    });
    await telegramApi(token, "sendMessage", { chat_id: chatId, text: "已转给客服。" });
    return;
  }

  await sendMenu(token, chatId, "请选择下方菜单，或发送 /start。");
}

async function handleCallback(database: D1Database, token: string, chatId: string, config: TelegramSupportConfig, data: string, callbackId: string, fromLabel: string) {
  await telegramApi(token, "answerCallbackQuery", { callback_query_id: callbackId });
  if (data === "support:query") {
    await beginQuery(database, token, chatId);
    return;
  }
  if (data === "support:buy") {
    await handleBuy(database, token, chatId);
    return;
  }
  if (data === "support:pay") {
    await handlePay(database, token, chatId);
    return;
  }
  if (data === "support:human") {
    await beginHuman(database, token, chatId, config, fromLabel);
  }
}

export async function handleTelegramSupportWebhook(database: D1Database, request: Request): Promise<Response> {
  const loaded = await loadConfig(database);
  if (!loaded?.enabled) return new Response(null, { status: 404 });

  const secret = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
  if (!timingSafeEqual(secret, loaded.config.webhookSecret)) {
    return new Response(null, { status: 403 });
  }

  let update: TelegramUpdate;
  try {
    update = await request.json() as TelegramUpdate;
  } catch {
    return Response.json({});
  }

  try {
    const token = loaded.config.botToken;
    if (update.callback_query?.data && update.callback_query.message?.chat?.id !== undefined) {
      const chatId = String(update.callback_query.message.chat.id);
      const from = update.callback_query.from;
      const fromLabel = from?.username ? `@${from.username}` : (from?.first_name || chatId);
      await handleCallback(database, token, chatId, loaded.config, update.callback_query.data, update.callback_query.id ?? "", fromLabel);
      return Response.json({});
    }

    const message = update.message;
    if (!message?.chat?.id || message.from?.is_bot) return Response.json({});
    const chatId = String(message.chat.id);
    const adminChatId = await resolveAdminChatId(database, loaded.config);
    if (adminChatId && chatId === String(adminChatId)) return Response.json({});

    const text = message.text?.trim();
    if (!text) return Response.json({});
    const from = message.from;
    const fromLabel = from?.username ? `@${from.username}` : (from?.first_name || chatId);
    await handleText(database, token, chatId, loaded.config, text, fromLabel);
  } catch (cause) {
    reportUnexpectedServerError("telegram-support-webhook", cause, { updateId: update.update_id });
  }
  return Response.json({});
}

export async function setTelegramSupportWebhook(config: TelegramSupportConfig, siteUrl: string) {
  const url = new URL("/api/telegram/support", siteUrl).toString();
  await telegramApi(config.botToken, "setWebhook", {
    url,
    secret_token: config.webhookSecret,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
  return { url };
}

export async function sendTelegramSupportTestMessage(config: TelegramSupportConfig, adminChatId: string, siteName: string) {
  await telegramApi(config.botToken, "sendMessage", {
    chat_id: adminChatId,
    text: `【${siteName}】客服机器人测试消息发送成功。`,
  });
}
