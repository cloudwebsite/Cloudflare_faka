import { plainTextSummary } from "@/server/content/public";

export default function description(pageContext: { data?: { summary?: string | null; bodyHtml?: string }; site?: { subtitle?: string | null } }) {
  return pageContext.data?.summary?.trim()
    || (pageContext.data?.bodyHtml ? plainTextSummary(pageContext.data.bodyHtml) : "")
    || pageContext.site?.subtitle
    || "帮助中心";
}
