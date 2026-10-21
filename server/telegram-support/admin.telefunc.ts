import { eq } from "drizzle-orm";
import { telegramSupportConfig } from "@/database/drizzle/schema";
import { appError } from "@/lib/app-error";
import { telefuncAction } from "@/server/telefunc-action";
import { requireAdmin } from "@/server/telefunc-context";
import { getSiteSettings } from "@/server/site/public-settings";
import { maskTelegramToken, parseTelegramSupportConfig } from "./config";
import { sendTelegramSupportTestMessage, setTelegramSupportWebhook } from "./handler";

function randomWebhookSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function getTelegramSupport() {
  const { db, database } = requireAdmin();
  const [record] = await db.select().from(telegramSupportConfig).where(eq(telegramSupportConfig.id, 1)).limit(1);
  const settings = await getSiteSettings(database);
  if (!record) {
    return {
      config: {
        isEnabled: false,
        botToken: "",
        botTokenConfigured: false,
        webhookSecret: "",
        adminChatId: "",
        welcomeMessage: "",
        configurationError: false,
      },
      siteUrl: settings.siteUrl,
      generatedSecret: randomWebhookSecret(),
    };
  }
  try {
    const parsed = parseTelegramSupportConfig(record.configJson);
    return {
      config: {
        isEnabled: record.isEnabled,
        botToken: maskTelegramToken(parsed.botToken),
        botTokenConfigured: true,
        webhookSecret: parsed.webhookSecret,
        adminChatId: parsed.adminChatId,
        welcomeMessage: parsed.welcomeMessage ?? "",
        configurationError: false,
      },
      siteUrl: settings.siteUrl,
      generatedSecret: randomWebhookSecret(),
    };
  } catch {
    return {
      config: {
        isEnabled: false,
        botToken: "",
        botTokenConfigured: false,
        webhookSecret: "",
        adminChatId: "",
        welcomeMessage: "",
        configurationError: true,
      },
      siteUrl: settings.siteUrl,
      generatedSecret: randomWebhookSecret(),
    };
  }
}

async function saveTelegramSupport(input: {
  isEnabled: boolean;
  botToken: string;
  webhookSecret: string;
  adminChatId: string;
  welcomeMessage?: string;
}) {
  const { db } = requireAdmin();
  if (!input || typeof input.isEnabled !== "boolean") appError("TELEGRAM_SUPPORT_CONFIG_INVALID");

  const [existing] = await db.select().from(telegramSupportConfig).where(eq(telegramSupportConfig.id, 1)).limit(1);
  let botToken = input.botToken.trim();
  if ((!botToken || botToken.includes("…")) && existing) {
    try {
      botToken = parseTelegramSupportConfig(existing.configJson).botToken;
    } catch {
      appError("TELEGRAM_SUPPORT_CONFIG_INVALID");
    }
  }

  let parsed;
  try {
    parsed = parseTelegramSupportConfig(JSON.stringify({
      schemaVersion: 1,
      botToken,
      webhookSecret: input.webhookSecret,
      adminChatId: input.adminChatId,
      welcomeMessage: input.welcomeMessage ?? "",
    }));
  } catch {
    appError("TELEGRAM_SUPPORT_CONFIG_INVALID");
  }

  const now = new Date();
  const configJson = JSON.stringify(parsed);
  if (existing) {
    await db.update(telegramSupportConfig).set({
      isEnabled: input.isEnabled,
      configJson,
      updatedAt: now,
    }).where(eq(telegramSupportConfig.id, 1));
  } else {
    await db.insert(telegramSupportConfig).values({
      id: 1,
      isEnabled: input.isEnabled,
      configJson,
      createdAt: now,
      updatedAt: now,
    });
  }
  return { ok: true };
}

async function registerTelegramSupportWebhook() {
  const { db, database } = requireAdmin();
  const [record] = await db.select().from(telegramSupportConfig).where(eq(telegramSupportConfig.id, 1)).limit(1);
  if (!record) appError("TELEGRAM_SUPPORT_NOT_FOUND");
  let config;
  try {
    config = parseTelegramSupportConfig(record.configJson);
  } catch {
    appError("TELEGRAM_SUPPORT_CONFIG_INVALID");
  }
  const settings = await getSiteSettings(database);
  if (!settings.siteUrl?.trim()) appError("TELEGRAM_SUPPORT_SITE_URL_REQUIRED");
  try {
    return await setTelegramSupportWebhook(config, settings.siteUrl.trim());
  } catch {
    appError("TELEGRAM_SUPPORT_WEBHOOK_FAILED");
  }
}

async function testTelegramSupport() {
  const { db, database } = requireAdmin();
  const [record] = await db.select().from(telegramSupportConfig).where(eq(telegramSupportConfig.id, 1)).limit(1);
  if (!record) appError("TELEGRAM_SUPPORT_NOT_FOUND");
  let config;
  try {
    config = parseTelegramSupportConfig(record.configJson);
  } catch {
    appError("TELEGRAM_SUPPORT_CONFIG_INVALID");
  }
  const settings = await getSiteSettings(database);
  const adminChatId = config.adminChatId;
  if (!adminChatId) appError("TELEGRAM_SUPPORT_ADMIN_CHAT_REQUIRED");
  try {
    await sendTelegramSupportTestMessage(config, adminChatId, settings.siteName);
  } catch {
    appError("TELEGRAM_SEND_FAILED");
  }
  return { ok: true };
}

export const onGetTelegramSupport = telefuncAction(getTelegramSupport);
export const onSaveTelegramSupport = telefuncAction(saveTelegramSupport);
export const onRegisterTelegramSupportWebhook = telefuncAction(registerTelegramSupportWebhook);
export const onTestTelegramSupport = telefuncAction(testTelegramSupport);
export const onGenerateTelegramSupportSecret = telefuncAction(async () => {
  requireAdmin();
  return { secret: randomWebhookSecret() };
});
