export default function title(pageContext: { site?: { name?: string } }) {
  return pageContext.site?.name || "faka-Shop";
}
