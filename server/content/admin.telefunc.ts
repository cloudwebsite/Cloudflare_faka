import { and, asc, desc, eq, ne } from "drizzle-orm";
import { siteArticle } from "@/database/drizzle/schema";
import { appError } from "@/lib/app-error";
import { slugify } from "@/lib/slugify";
import { sanitizeProductDescription } from "@/server/catalog/product-description";
import { telefuncAction } from "@/server/telefunc-action";
import { requireAdmin } from "@/server/telefunc-context";

export type ArticleType = "NEWS" | "HELP" | "PAGE";
export type ArticleStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

const typeSet = new Set<ArticleType>(["NEWS", "HELP", "PAGE"]);
const statusSet = new Set<ArticleStatus>(["DRAFT", "PUBLISHED", "ARCHIVED"]);

function getAdminDb() {
  const { db } = requireAdmin();
  return { db };
}

function requiredText(value: unknown, requiredCode: string, maxLength: number, tooLongCode: string) {
  if (typeof value !== "string") appError(requiredCode);
  const normalized = value.trim();
  if (!normalized) appError(requiredCode);
  if (normalized.length > maxLength) appError(tooLongCode);
  return normalized;
}

function optionalText(value: unknown, maxLength: number, code: string) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") appError(code);
  const normalized = value.trim();
  if (normalized.length > maxLength) appError(code);
  return normalized || null;
}

function nonNegativeInteger(value: unknown, code: string) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) appError(code);
  return value;
}

function resolveSlug(slug: unknown, title: string) {
  const raw = typeof slug === "string" && slug.trim() ? slug.trim().toLowerCase() : slugify(title);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) || raw.length < 2 || raw.length > 80) appError("ARTICLE_SLUG_INVALID");
  return raw;
}

function resolveCoverImage(value: unknown) {
  const image = optionalText(value, 2_048, "ARTICLE_COVER_INVALID");
  if (!image) return null;
  if (image.startsWith("/media/proxy/")) return image;
  try {
    const url = new URL(image);
    if (url.protocol === "http:" || url.protocol === "https:") return image;
  } catch { /* reject */ }
  appError("ARTICLE_COVER_INVALID");
}

function parseType(value: unknown): ArticleType {
  if (typeof value !== "string" || !typeSet.has(value as ArticleType)) appError("ARTICLE_TYPE_INVALID");
  return value as ArticleType;
}

function parseStatus(value: unknown): ArticleStatus {
  if (typeof value !== "string" || !statusSet.has(value as ArticleStatus)) appError("ARTICLE_STATUS_INVALID");
  return value as ArticleStatus;
}

function parsePublishedAt(value: unknown): Date | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return new Date(value);
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return new Date(parsed);
  }
  appError("ARTICLE_PUBLISHED_AT_INVALID");
}

function serializeArticle(row: typeof siteArticle.$inferSelect) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverImage: row.coverImage,
    bodyHtml: row.bodyHtml,
    status: row.status,
    pinned: row.pinned,
    sort: row.sort,
    publishedAt: row.publishedAt ? row.publishedAt.getTime() : null,
    createdAt: row.createdAt.getTime(),
    updatedAt: row.updatedAt.getTime(),
  };
}

async function assertSlugAvailable(
  db: ReturnType<typeof requireAdmin>["db"],
  type: ArticleType,
  slug: string,
  excludeId?: number,
) {
  const where = excludeId
    ? and(eq(siteArticle.type, type), eq(siteArticle.slug, slug), ne(siteArticle.id, excludeId))
    : and(eq(siteArticle.type, type), eq(siteArticle.slug, slug));
  const [existing] = await db.select({ id: siteArticle.id }).from(siteArticle).where(where).limit(1);
  if (existing) appError("ARTICLE_SLUG_TAKEN");
}

async function internalOnListArticles(input: { type: ArticleType }) {
  const { db } = getAdminDb();
  const type = parseType(input?.type);
  const rows = await db
    .select()
    .from(siteArticle)
    .where(eq(siteArticle.type, type))
    .orderBy(desc(siteArticle.pinned), asc(siteArticle.sort), desc(siteArticle.publishedAt), desc(siteArticle.id));
  return rows.map(serializeArticle);
}

async function internalOnGetArticle(input: { id: number }) {
  const { db } = getAdminDb();
  if (!input || !Number.isInteger(input.id) || input.id <= 0) appError("ARTICLE_ID_INVALID");
  const [row] = await db.select().from(siteArticle).where(eq(siteArticle.id, input.id)).limit(1);
  if (!row) appError("ARTICLE_NOT_FOUND");
  return serializeArticle(row);
}

async function internalOnSaveArticle(input: {
  id?: number;
  type: ArticleType;
  title: string;
  slug?: string;
  summary?: string | null;
  coverImage?: string | null;
  bodyHtml: string;
  status: ArticleStatus;
  pinned?: boolean;
  sort: number;
  publishedAt?: number | string | null;
}) {
  const { db } = getAdminDb();
  if (!input || typeof input !== "object") appError("ARTICLE_INPUT_INVALID");
  const type = parseType(input.type);
  const status = parseStatus(input.status);
  const title = requiredText(input.title, "ARTICLE_TITLE_REQUIRED", 200, "ARTICLE_TITLE_TOO_LONG");
  const slug = resolveSlug(input.slug, title);
  const summary = optionalText(input.summary, 500, "ARTICLE_SUMMARY_INVALID");
  const coverImage = resolveCoverImage(input.coverImage);
  const rawBody = typeof input.bodyHtml === "string" ? input.bodyHtml : "";
  const bodyHtml = sanitizeProductDescription(rawBody || "<p></p>") ?? "";
  if (status === "PUBLISHED" && !bodyHtml.replace(/<[^>]*>/g, "").trim()) appError("ARTICLE_BODY_REQUIRED");
  const pinned = Boolean(input.pinned);
  const sort = nonNegativeInteger(input.sort, "ARTICLE_SORT_INVALID");
  let publishedAt = parsePublishedAt(input.publishedAt);
  const now = new Date();
  if (status === "PUBLISHED" && !publishedAt) publishedAt = now;

  if (input.id !== undefined) {
    if (!Number.isInteger(input.id) || input.id <= 0) appError("ARTICLE_ID_INVALID");
    const [existing] = await db.select().from(siteArticle).where(eq(siteArticle.id, input.id)).limit(1);
    if (!existing) appError("ARTICLE_NOT_FOUND");
    if (existing.type !== type) appError("ARTICLE_TYPE_INVALID");
    await assertSlugAvailable(db, type, slug, input.id);
    const [saved] = await db
      .update(siteArticle)
      .set({ title, slug, summary, coverImage, bodyHtml, status, pinned, sort, publishedAt, updatedAt: now })
      .where(eq(siteArticle.id, input.id))
      .returning();
    if (!saved) appError("ARTICLE_NOT_FOUND");
    return serializeArticle(saved);
  }

  await assertSlugAvailable(db, type, slug);
  const [saved] = await db
    .insert(siteArticle)
    .values({ type, title, slug, summary, coverImage, bodyHtml, status, pinned, sort, publishedAt, createdAt: now, updatedAt: now })
    .returning();
  return serializeArticle(saved);
}

async function internalOnSetArticleStatus(input: { id: number; status: ArticleStatus }) {
  const { db } = getAdminDb();
  if (!input || !Number.isInteger(input.id) || input.id <= 0) appError("ARTICLE_ID_INVALID");
  const status = parseStatus(input.status);
  const [existing] = await db.select().from(siteArticle).where(eq(siteArticle.id, input.id)).limit(1);
  if (!existing) appError("ARTICLE_NOT_FOUND");
  if (status === "PUBLISHED" && !existing.bodyHtml.replace(/<[^>]*>/g, "").trim()) appError("ARTICLE_BODY_REQUIRED");
  const now = new Date();
  const publishedAt = status === "PUBLISHED" && !existing.publishedAt ? now : existing.publishedAt;
  const [saved] = await db
    .update(siteArticle)
    .set({ status, publishedAt, updatedAt: now })
    .where(eq(siteArticle.id, input.id))
    .returning();
  if (!saved) appError("ARTICLE_NOT_FOUND");
  return serializeArticle(saved);
}

async function internalOnSetArticlePinned(input: { id: number; pinned: boolean }) {
  const { db } = getAdminDb();
  if (!input || !Number.isInteger(input.id) || input.id <= 0) appError("ARTICLE_ID_INVALID");
  const [saved] = await db
    .update(siteArticle)
    .set({ pinned: Boolean(input.pinned), updatedAt: new Date() })
    .where(eq(siteArticle.id, input.id))
    .returning();
  if (!saved) appError("ARTICLE_NOT_FOUND");
  return serializeArticle(saved);
}

async function internalOnDeleteArticle(input: { id: number }) {
  const { db } = getAdminDb();
  if (!input || !Number.isInteger(input.id) || input.id <= 0) appError("ARTICLE_ID_INVALID");
  const [record] = await db.delete(siteArticle).where(eq(siteArticle.id, input.id)).returning({ id: siteArticle.id });
  if (!record) appError("ARTICLE_NOT_FOUND");
  return record;
}

export const onListArticles = telefuncAction(internalOnListArticles);
export const onGetArticle = telefuncAction(internalOnGetArticle);
export const onSaveArticle = telefuncAction(internalOnSaveArticle);
export const onSetArticleStatus = telefuncAction(internalOnSetArticleStatus);
export const onSetArticlePinned = telefuncAction(internalOnSetArticlePinned);
export const onDeleteArticle = telefuncAction(internalOnDeleteArticle);
