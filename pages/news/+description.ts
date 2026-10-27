import { pickLocalizedText, resolveLocale, type LocalizedNullableText } from "@/lib/i18n/localized-text";

export default function description(pageContext: { site?: { subtitle?: LocalizedNullableText | null }; locale?: string }) {
  const locale = resolveLocale(pageContext.locale);
  const subtitle = pageContext.site?.subtitle ? pickLocalizedText(pageContext.site.subtitle, locale) : "";
  return subtitle.trim() || "站点新闻与公告";
}
