import { pickLocalizedText, resolveLocale, type LocalizedNullableText } from "@/lib/i18n/localized-text";
import { plainTextSummary } from "@/server/content/public";

export default function description(pageContext: {
  data?: { summary?: string | null; bodyHtml?: string };
  site?: { subtitle?: LocalizedNullableText | null };
  locale?: string;
}) {
  const locale = resolveLocale(pageContext.locale);
  const siteSubtitle = pageContext.site?.subtitle ? pickLocalizedText(pageContext.site.subtitle, locale) : "";
  return pageContext.data?.summary?.trim()
    || (pageContext.data?.bodyHtml ? plainTextSummary(pageContext.data.bodyHtml) : "")
    || siteSubtitle
    || "帮助中心";
}
