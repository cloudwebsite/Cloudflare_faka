export default function description(pageContext: { site?: { subtitle?: string | null } }) {
  return pageContext.site?.subtitle || "购买与查单帮助";
}
