/** Strip HTML tags for compact previews (notices, meta descriptions). */
export function plainTextFromHtml(html: string | null | undefined, maxLength = 160) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function isEmptyHtml(html: string | null | undefined) {
  return !plainTextFromHtml(html, Number.POSITIVE_INFINITY);
}
