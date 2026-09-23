import { and, asc, count, desc, eq } from "drizzle-orm";
import { createDrizzleDb, type AppDb } from "@/database/drizzle";
import { siteArticle } from "@/database/drizzle/schema";

export type ArticleType = "NEWS" | "HELP" | "PAGE";

export type PublicArticleListItem = {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  pinned: boolean;
  sort: number;
  publishedAt: number | null;
};

export type PublicArticleDetail = PublicArticleListItem & {
  type: ArticleType;
  bodyHtml: string;
};

const listSelect = {
  id: siteArticle.id,
  title: siteArticle.title,
  slug: siteArticle.slug,
  summary: siteArticle.summary,
  coverImage: siteArticle.coverImage,
  pinned: siteArticle.pinned,
  sort: siteArticle.sort,
  publishedAt: siteArticle.publishedAt,
} as const;

function dbOf(database: D1Database): AppDb {
  return createDrizzleDb(database);
}

function publishedAtMs(value: Date | null | undefined) {
  return value ? value.getTime() : null;
}

function mapListItem(row: {
  id: number;
  title: string;
  slug: string;
  summary: string | null;
  coverImage: string | null;
  pinned: boolean;
  sort: number;
  publishedAt: Date | null;
}): PublicArticleListItem {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverImage: row.coverImage,
    pinned: row.pinned,
    sort: row.sort,
    publishedAt: publishedAtMs(row.publishedAt),
  };
}

const listOrder = [desc(siteArticle.pinned), asc(siteArticle.sort), desc(siteArticle.publishedAt), desc(siteArticle.id)] as const;

export async function listPublishedArticles(
  database: D1Database,
  type: ArticleType,
  options: { page?: number; pageSize?: number } = {},
) {
  const db = dbOf(database);
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10));
  const page = Math.max(1, options.page ?? 1);
  const offset = (page - 1) * pageSize;
  const where = and(eq(siteArticle.type, type), eq(siteArticle.status, "PUBLISHED"));

  const [totalRow] = await db.select({ total: count() }).from(siteArticle).where(where);
  const rows = await db
    .select(listSelect)
    .from(siteArticle)
    .where(where)
    .orderBy(...listOrder)
    .limit(pageSize)
    .offset(offset);

  return {
    items: rows.map(mapListItem),
    page,
    pageSize,
    total: totalRow?.total ?? 0,
  };
}

export async function getPublishedArticleBySlug(database: D1Database, type: ArticleType, slug: string) {
  const db = dbOf(database);
  const [row] = await db
    .select({
      ...listSelect,
      type: siteArticle.type,
      bodyHtml: siteArticle.bodyHtml,
    })
    .from(siteArticle)
    .where(and(eq(siteArticle.type, type), eq(siteArticle.slug, slug), eq(siteArticle.status, "PUBLISHED")))
    .limit(1);
  if (!row) return null;
  return {
    ...mapListItem(row),
    type: row.type,
    bodyHtml: row.bodyHtml,
  } satisfies PublicArticleDetail;
}

/** Footer links for fixed pages: published PAGE, pin + sort. */
export async function listPublishedPagesForFooter(database: D1Database) {
  const db = dbOf(database);
  return db
    .select({
      title: siteArticle.title,
      slug: siteArticle.slug,
    })
    .from(siteArticle)
    .where(and(eq(siteArticle.type, "PAGE"), eq(siteArticle.status, "PUBLISHED")))
    .orderBy(...listOrder)
    .limit(20);
}

export function plainTextSummary(html: string, maxLength = 160) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}
