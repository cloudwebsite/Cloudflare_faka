import { normalizeSiteTimezone } from "@/lib/site-timezone";
import { normalizeStorefrontLayout, normalizeStorefrontSkin } from "@/lib/storefront-templates/registry";
import { buildSupportContactSummary, normalizeTelegramUsername } from "@/lib/support-contact";

const URL_PROTOCOLS = new Set(["http:", "https:"]);

function optionalText(value: unknown, field: string, maxLength: number) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) throw new Error(`${field}_TOO_LONG`);
  return normalized;
}

function optionalUrl(value: unknown, field: string) {
  const normalized = optionalText(value, field, 2_048);
  if (!normalized) return null;

  try {
    const url = new URL(normalized);
    if (!URL_PROTOCOLS.has(url.protocol)) throw new Error();
    return url.toString();
  } catch {
    throw new Error(`${field}_INVALID`);
  }
}

function optionalEmail(value: unknown, field: string) {
  const normalized = optionalText(value, field, 254);
  if (!normalized) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error(`${field}_INVALID`);
  return normalized;
}

export type SiteSettingsInput = {
  siteName: string;
  siteUrl?: string | null;
  siteSubtitle?: string | null;
  logo?: string | null;
  logoIcon?: string | null;
  notice?: string | null;
  supportContact?: string | null;
  supportQq?: string | null;
  supportTelegram?: string | null;
  supportWechat?: string | null;
  supportWechatQr?: string | null;
  supportEmail?: string | null;
  supportCustomLinks?: string | null;
  footerText?: string | null;
  orderNotice?: string | null;
  headCode?: string | null;
  footerCode?: string | null;
  registrationEnabled?: boolean;
  timezone: string;
  storefrontLayout?: string | null;
  storefrontSkin?: string | null;
};

export function validateSiteSettingsInput(input: SiteSettingsInput) {
  const siteName = String(input.siteName ?? "").trim();
  if (!siteName) throw new Error("SITE_NAME_REQUIRED");
  if (siteName.length > 120) throw new Error("SITE_NAME_TOO_LONG");

  let timezone: string;
  try {
    timezone = normalizeSiteTimezone(String(input.timezone ?? ""));
  } catch {
    throw new Error("SITE_TIMEZONE_INVALID");
  }

  const supportQq = optionalText(input.supportQq, "SITE_SUPPORT_QQ", 32);
  const supportTelegramRaw = optionalText(input.supportTelegram, "SITE_SUPPORT_TELEGRAM", 64);
  const supportTelegram = supportTelegramRaw ? normalizeTelegramUsername(supportTelegramRaw) : null;
  const supportWechat = optionalText(input.supportWechat, "SITE_SUPPORT_WECHAT", 64);
  const supportWechatQr = optionalUrl(input.supportWechatQr, "SITE_SUPPORT_WECHAT_QR");
  const supportEmail = optionalEmail(input.supportEmail, "SITE_SUPPORT_EMAIL");
  const supportCustomLinks = optionalText(input.supportCustomLinks, "SITE_SUPPORT_CUSTOM_LINKS", 2_000);

  const structured = {
    supportQq,
    supportTelegram,
    supportWechat,
    supportWechatQr,
    supportEmail,
    supportCustomLinks,
  };

  const autoSummary = buildSupportContactSummary(structured);
  const supportContact = autoSummary ?? optionalText(input.supportContact, "SITE_SUPPORT_CONTACT", 2_000);

  return {
    siteName,
    siteUrl: optionalUrl(input.siteUrl, "SITE_URL"),
    siteSubtitle: optionalText(input.siteSubtitle, "SITE_SUBTITLE", 300),
    logo: optionalUrl(input.logo, "SITE_LOGO_URL"),
    logoIcon: optionalUrl(input.logoIcon, "SITE_FAVICON_URL"),
    notice: optionalText(input.notice, "SITE_NOTICE", 50_000),
    supportContact,
    ...structured,
    footerText: optionalText(input.footerText, "SITE_FOOTER_TEXT", 1_000),
    orderNotice: optionalText(input.orderNotice, "SITE_ORDER_NOTICE", 2_000),
    headCode: optionalText(input.headCode, "SITE_HEAD_CODE", 20_000),
    footerCode: optionalText(input.footerCode, "SITE_FOOTER_CODE", 20_000),
    registrationEnabled: input.registrationEnabled === true,
    timezone,
    storefrontLayout: normalizeStorefrontLayout(input.storefrontLayout),
    storefrontSkin: normalizeStorefrontSkin(input.storefrontSkin),
  };
}
