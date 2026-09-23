import { asc, eq } from "drizzle-orm";
import { telefuncAction } from "@/server/telefunc-action";
import { requireAdmin } from "@/server/telefunc-context";
import { appError } from "@/lib/app-error";
import { storefrontBanner } from "@/database/drizzle/schema";

function getAdminDb() {
  const { db } = requireAdmin();
  return { db };
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

function resolveImageUrl(value: unknown, required: boolean) {
  const image = optionalText(value, 2_048, "BANNER_IMAGE_INVALID");
  if (!image) {
    if (required) appError("BANNER_IMAGE_REQUIRED");
    return null;
  }
  if (image.startsWith("/media/proxy/")) return image;
  try {
    const url = new URL(image);
    if (url.protocol === "http:" || url.protocol === "https:") return image;
  } catch { /* reject below */ }
  appError("BANNER_IMAGE_INVALID");
}

function resolveLinkUrl(value: unknown) {
  const link = optionalText(value, 2_048, "BANNER_LINK_INVALID");
  if (!link) return null;
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    if (url.protocol === "http:" || url.protocol === "https:") return link;
  } catch { /* reject below */ }
  appError("BANNER_LINK_INVALID");
}

async function internalOnListBanners() {
  const { db } = getAdminDb();
  return db
    .select({
      id: storefrontBanner.id,
      title: storefrontBanner.title,
      imageUrl: storefrontBanner.imageUrl,
      linkUrl: storefrontBanner.linkUrl,
      sort: storefrontBanner.sort,
      status: storefrontBanner.status,
    })
    .from(storefrontBanner)
    .orderBy(asc(storefrontBanner.sort), asc(storefrontBanner.id));
}

async function internalOnSaveBanner(input: {
  id?: number;
  title?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  sort: number;
}) {
  const { db } = getAdminDb();
  const now = new Date();
  const values = {
    title: optionalText(input.title, 120, "BANNER_TITLE_INVALID"),
    imageUrl: resolveImageUrl(input.imageUrl, true)!,
    linkUrl: resolveLinkUrl(input.linkUrl),
    sort: nonNegativeInteger(input.sort, "BANNER_SORT_INVALID"),
    updatedAt: now,
  };

  if (input.id) {
    if (!Number.isInteger(input.id) || input.id <= 0) appError("BANNER_ID_INVALID");
    const [record] = await db.update(storefrontBanner).set(values).where(eq(storefrontBanner.id, input.id)).returning();
    if (!record) appError("BANNER_NOT_FOUND");
    return record;
  }

  const [record] = await db.insert(storefrontBanner).values({ ...values, status: "ACTIVE", createdAt: now }).returning();
  return record;
}

async function internalOnSetBannerStatus(input: { id: number; status: "ACTIVE" | "DISABLED" }) {
  const { db } = getAdminDb();
  if (!input || !Number.isInteger(input.id) || input.id <= 0) appError("BANNER_ID_INVALID");
  if (input.status !== "ACTIVE" && input.status !== "DISABLED") appError("BANNER_STATUS_INVALID");
  const [record] = await db
    .update(storefrontBanner)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(storefrontBanner.id, input.id))
    .returning();
  if (!record) appError("BANNER_NOT_FOUND");
  return record;
}

async function internalOnDeleteBanner(input: { id: number }) {
  const { db } = getAdminDb();
  if (!input || !Number.isInteger(input.id) || input.id <= 0) appError("BANNER_ID_INVALID");
  const [record] = await db.delete(storefrontBanner).where(eq(storefrontBanner.id, input.id)).returning({ id: storefrontBanner.id });
  if (!record) appError("BANNER_NOT_FOUND");
  return record;
}

export const onListBanners = telefuncAction(internalOnListBanners);
export const onSaveBanner = telefuncAction(internalOnSaveBanner);
export const onSetBannerStatus = telefuncAction(internalOnSetBannerStatus);
export const onDeleteBanner = telefuncAction(internalOnDeleteBanner);
