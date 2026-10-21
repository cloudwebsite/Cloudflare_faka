export default function title(pageContext: { data?: { title?: string }; site?: { name?: string } }) {
  const siteName = pageContext.site?.name || "faka-Shop";
  return pageContext.data?.title ? `${pageContext.data.title} - ${siteName}` : siteName;
}
