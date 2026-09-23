export default function description(pageContext: { site?: { subtitle?: string | null } }) {
  return pageContext.site?.subtitle || "站点新闻与公告";
}
