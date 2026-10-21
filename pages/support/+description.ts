export default function description(pageContext: { site?: { subtitle?: string | null } }) {
  return pageContext.site?.subtitle || "联系客服获取帮助";
}
