import { env } from "cloudflare:workers";
import { listPublishedArticles } from "@/server/content/public";
import { withServerDataErrorHandling } from "@/server/error-handling";

export type Data = Awaited<ReturnType<typeof data>>;

function parsePage(raw: unknown) {
  const value = typeof raw === "string" ? Number(raw) : 1;
  return Number.isInteger(value) && value > 0 ? value : 1;
}

export async function data(pageContext: { urlParsed?: { search?: { page?: string } } }) {
  return withServerDataErrorHandling("page data: news list", pageContext, async () => {
    const page = parsePage(pageContext.urlParsed?.search?.page);
    return listPublishedArticles(env.DB, "NEWS", { page, pageSize: 10 });
  });
}
