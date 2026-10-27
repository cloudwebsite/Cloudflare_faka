import {
  pickLocalizedOptionalText,
  pickLocalizedText,
  type LocalizedNullableText,
  type LocalizedText,
} from "@/lib/i18n/localized-text";
import type { StorefrontLocale } from "@/lib/i18n/locale";
import type { PublicCatalog, PublicProductDetail, PublicSku } from "@/server/catalog/public";
import type { PublicSiteSettings } from "@/server/site/public-settings";

export type LocalizedPublicSite = Omit<
  PublicSiteSettings,
  "subtitle" | "notice" | "supportContact" | "footerText" | "orderNotice"
> & {
  subtitle: string | null;
  notice: string | null;
  supportContact: string | null;
  footerText: string;
  orderNotice: string | null;
};

export type LocalizedPublicSku = Omit<PublicSku, "name"> & { name: string };

export type LocalizedPublicCatalog = {
  categories: Array<{
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
  }>;
  products: Array<{
    id: number;
    categoryId: number | null;
    categoryName: string | null;
    name: string;
    slug: string;
    subtitle: string | null;
    coverImage: string | null;
    price: string;
    priceMinor: number;
    basePriceMinor: number;
    currency: PublicCatalog["products"][number]["currency"];
    deliveryType: PublicCatalog["products"][number]["deliveryType"];
    physicalStock: number | null;
    availableStock: number | null;
    minBuy: number;
    maxBuy: number;
  }>;
  banners: PublicCatalog["banners"];
  currencyRates: PublicCatalog["currencyRates"];
};

export type LocalizedPublicProductDetail = LocalizedPublicCatalog["products"][number] & {
  description: string | null;
  purchaseNote: string | null;
  manualDeliveryHint: string | null;
  skus: LocalizedPublicSku[];
  currencyRates: PublicCatalog["currencyRates"];
};

function text(value: LocalizedText, locale: StorefrontLocale) {
  return pickLocalizedText(value, locale);
}

function optional(value: LocalizedNullableText | null | undefined, locale: StorefrontLocale) {
  return value ? pickLocalizedOptionalText(value, locale) : null;
}

export function localizePublicSite(site: PublicSiteSettings, locale: StorefrontLocale): LocalizedPublicSite {
  return {
    ...site,
    subtitle: optional(site.subtitle, locale),
    notice: optional(site.notice, locale),
    supportContact: optional(site.supportContact, locale),
    footerText: text(site.footerText, locale),
    orderNotice: optional(site.orderNotice, locale),
  };
}

export function localizePublicCatalog(catalog: PublicCatalog, locale: StorefrontLocale): LocalizedPublicCatalog {
  return {
    categories: catalog.categories.map((category) => ({
      ...category,
      name: text(category.name, locale),
      description: optional(category.description, locale),
    })),
    products: catalog.products.map((product) => ({
      ...product,
      name: text(product.name, locale),
      subtitle: optional(product.subtitle, locale),
      categoryName: optional(product.categoryName, locale),
    })),
    banners: catalog.banners,
    currencyRates: catalog.currencyRates,
  };
}

export function localizePublicProductDetail(product: PublicProductDetail, locale: StorefrontLocale): LocalizedPublicProductDetail {
  return {
    ...product,
    name: text(product.name, locale),
    subtitle: optional(product.subtitle, locale),
    categoryName: optional(product.categoryName, locale),
    description: optional(product.description, locale),
    skus: product.skus.map((sku) => ({
      ...sku,
      name: text(sku.name, locale),
    })),
  };
}
