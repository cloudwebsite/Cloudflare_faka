export type TelegramSupportConfig = {
  schemaVersion: 1;
  botToken: string;
  webhookSecret: string;
  adminChatId: string;
  welcomeMessage?: string;
};

export type TelegramSupportSessionState = "idle" | "await_order" | "await_email" | "human";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseTelegramSupportConfig(json: string): TelegramSupportConfig {
  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  }
  if (!isRecord(value) || value.schemaVersion !== 1) throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  if (typeof value.botToken !== "string" || typeof value.webhookSecret !== "string" || typeof value.adminChatId !== "string") {
    throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  }
  const botToken = value.botToken.trim();
  const webhookSecret = value.webhookSecret.trim();
  const adminChatId = value.adminChatId.trim();
  if (!/^\d+:[A-Za-z0-9_-]+$/.test(botToken)) throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  if (!webhookSecret || webhookSecret.length < 16 || webhookSecret.length > 256) throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  if (adminChatId && adminChatId.length > 128) throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  if (adminChatId && !/^-?\d+$/.test(adminChatId) && !/^@[A-Za-z][A-Za-z0-9_]{4,}$/.test(adminChatId)) {
    throw new Error("TELEGRAM_SUPPORT_CONFIG_INVALID");
  }
  const welcomeMessage = typeof value.welcomeMessage === "string" ? value.welcomeMessage.trim().slice(0, 500) : "";
  return {
    schemaVersion: 1,
    botToken,
    webhookSecret,
    adminChatId,
    ...(welcomeMessage ? { welcomeMessage } : {}),
  };
}

export function maskTelegramToken(token: string) {
  if (token.length <= 10) return "********";
  return `${token.slice(0, 6)}…${token.slice(-4)}`;
}
