import type { PageContextServer } from "vike/types";
import { env } from "@/server/env";
import { listPublishedPagesForFooter } from "@/server/content/public";
import { resolveHeadersLocale } from "@/lib/i18n/locale";
import { buildLocalizedOptionalText, buildLocalizedText } from "@/lib/i18n/localized-text";
import { DEFAULT_STOREFRONT_LAYOUT, DEFAULT_STOREFRONT_SKIN } from "@/lib/storefront-templates/registry";
import { BASE_CURRENCY } from "@/lib/money";
import { DEFAULT_FOOTER_TEXT, getSiteSettings, toPublicSiteSettings } from "@/server/site/public-settings";

export async function onBeforeRender(pageContext: PageContextServer) {
  const locale = resolveHeadersLocale(pageContext.headers as Record<string, string | undefined> | undefined);

  try {
    const [settings, footerPages] = await Promise.all([
      getSiteSettings(env.DB),
      listPublishedPagesForFooter(env.DB).catch(() => []),
    ]);
    return {
      pageContext: {
        site: toPublicSiteSettings(settings),
        footerPages,
        locale,
      },
    };
  } catch {
    return {
      pageContext: {
        site: {
          name: "FAKA-Shop",
          subtitle: buildLocalizedOptionalText(null, {}, "subtitle"),
          siteUrl: null,
          logo: null,
          logoIcon: null,
          notice: buildLocalizedOptionalText(null, {}, "notice"),
          supportContact: buildLocalizedOptionalText(null, {}, "supportContact"),
          supportChannels: [],
          footerText: buildLocalizedText(DEFAULT_FOOTER_TEXT, {}, "footerText"),
          orderNotice: buildLocalizedOptionalText(null, {}, "orderNotice"),
          currency: BASE_CURRENCY,
          layout: DEFAULT_STOREFRONT_LAYOUT,
          skin: DEFAULT_STOREFRONT_SKIN,
        },
        footerPages: [],
        locale,
      },
    };
  }
}
