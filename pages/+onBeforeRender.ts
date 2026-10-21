import type { PageContextServer } from "vike/types";
import { env } from "@/server/env";
import { listPublishedPagesForFooter } from "@/server/content/public";
import { DEFAULT_STOREFRONT_LAYOUT, DEFAULT_STOREFRONT_SKIN } from "@/lib/storefront-templates/registry";
import { DEFAULT_FOOTER_TEXT, getSiteSettings, toPublicSiteSettings } from "@/server/site/public-settings";

export async function onBeforeRender(_pageContext: PageContextServer) {
  try {
    const [settings, footerPages] = await Promise.all([
      getSiteSettings(env.DB),
      listPublishedPagesForFooter(env.DB).catch(() => []),
    ]);
    return {
      pageContext: {
        site: toPublicSiteSettings(settings),
        footerPages,
      },
    };
  } catch {
    return {
      pageContext: {
        site: {
          name: "FAKA-Shop",
          subtitle: null,
          siteUrl: null,
          logo: null,
          logoIcon: null,
          notice: null,
          supportContact: null,
          supportChannels: [],
          footerText: DEFAULT_FOOTER_TEXT,
          orderNotice: null,
          layout: DEFAULT_STOREFRONT_LAYOUT,
          skin: DEFAULT_STOREFRONT_SKIN,
        },
        footerPages: [],
      },
    };
  }
}
