export default function title(pageContext: { site?: { name?: string } }) {
  const siteName = pageContext.site?.name || "FAKA-Shop";
  return `帮助中心 - ${siteName}`;
}
