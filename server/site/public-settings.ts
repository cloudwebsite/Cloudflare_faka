import { eq } from "drizzle-orm";
import { siteSetting } from "@/database/drizzle/schema";
import { createDrizzleDb } from "@/database/drizzle";
import {
  DEFAULT_STOREFRONT_LAYOUT,
  DEFAULT_STOREFRONT_SKIN,
  normalizeStorefrontLayout,
  normalizeStorefrontSkin,
} from "@/lib/storefront-templates/registry";
import type { StorefrontLayoutId, StorefrontSkinId } from "@/lib/storefront-templates/types";

export type PublicSiteSettings = {
  name: string;
  subtitle: string | null;
  siteUrl: string | null;
  logo: string | null;
  logoIcon: string | null;
  notice: string | null;
  supportContact: string | null;
  footerText: string | null;
  orderNotice: string | null;
  layout: StorefrontLayoutId;
  skin: StorefrontSkinId;
};

type SiteSettingRecord = typeof siteSetting.$inferSelect;

type CacheEntry = {
  value: SiteSettingRecord;
  expiresAt: number;
};

const CACHE_TTL_MS = 60_000;
let settingsCache: CacheEntry | null = null;

export const DEFAULT_FOOTER_TEXT = "© 2026 Cloudflare_faka 基于 GitHub 开源";
export const DEFAULT_SUPPORT_CONTACT = "GitHub Issues|https://github.com/cloudwebsite/Cloudflare_faka/issues";

const defaultSettings: SiteSettingRecord = {
  id: 1,
  siteName: "faka-Shop",
  siteUrl: null,
  siteSubtitle: null,
  logo: null,
  logoIcon: null,
  notice: null,
  supportContact: null,
  footerText: null,
  orderNotice: null,
  headCode: null,
  footerCode: null,
  registrationEnabled: false,
  timezone: "Asia/Shanghai",
  storefrontLayout: DEFAULT_STOREFRONT_LAYOUT,
  storefrontSkin: DEFAULT_STOREFRONT_SKIN,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

async function querySettings(database: D1Database) {
  const db = createDrizzleDb(database);
  const [record] = await db.select().from(siteSetting).where(eq(siteSetting.id, 1)).limit(1);
  return record ?? defaultSettings;
}

export async function getSiteSettings(database: D1Database) {
  if (settingsCache && settingsCache.expiresAt > Date.now()) return settingsCache.value;

  const value = await querySettings(database);
  settingsCache = { value, expiresAt: Date.now() + CACHE_TTL_MS };
  return value;
}

export function invalidateSiteSettings(_database?: D1Database) {
  settingsCache = null;
}

export function toPublicSiteSettings(record: SiteSettingRecord): PublicSiteSettings {
  return {
    name: record.siteName,
    subtitle: record.siteSubtitle,
    siteUrl: record.siteUrl,
    logo: record.logo,
    logoIcon: record.logoIcon || record.logo,
    notice: record.notice,
    supportContact: record.supportContact?.trim() || DEFAULT_SUPPORT_CONTACT,
    footerText: record.footerText?.trim() || DEFAULT_FOOTER_TEXT,
    orderNotice: record.orderNotice,
    layout: normalizeStorefrontLayout(record.storefrontLayout),
    skin: normalizeStorefrontSkin(record.storefrontSkin),
  };
}
