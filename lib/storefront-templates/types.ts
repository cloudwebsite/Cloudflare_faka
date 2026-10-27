export const STOREFRONT_LAYOUT_IDS = [
  "classic",
  "marketplace",
  "magazine",
  "sidebar",
  "lanyao",
  "quickcard",
  "duocai",
  "fashion",
  "wholesale",
] as const;

export const STOREFRONT_SKIN_IDS = [
  "default",
  "ocean",
  "ember",
  "slate",
  "forest",
  "rose",
  "sky",
  "amber",
  "grape",
] as const;

export type StorefrontLayoutId = (typeof STOREFRONT_LAYOUT_IDS)[number];
export type StorefrontSkinId = (typeof STOREFRONT_SKIN_IDS)[number];

export type StorefrontViewName =
  | "HomeView"
  | "ProductView"
  | "CheckoutView"
  | "AuthShell"
  | "AccountShell"
  | "OrderLookupView"
  | "PaymentResultView";

export type StorefrontLayoutMeta = {
  id: StorefrontLayoutId;
  name: string;
  description: string;
};

export type StorefrontSkinMeta = {
  id: StorefrontSkinId;
  name: string;
  description: string;
  swatch: string;
};
