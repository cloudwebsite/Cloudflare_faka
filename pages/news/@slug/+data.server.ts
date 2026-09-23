import { render } from "vike/abort";
import { env } from "cloudflare:workers";
import { getPublishedArticleBySlug } from "@/server/content/public";
import { withServerDataErrorHandling } from "@/server/error-handling";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: { routeParams: { slug: string } }) {
  return withServerDataErrorHandling("page data: news detail", pageContext, async () => {
    const article = await getPublishedArticleBySlug(env.DB, "NEWS", pageContext.routeParams.slug);
    if (!article) throw render(404);
    return article;
  });
}
