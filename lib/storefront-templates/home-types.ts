export type StorefrontHomeProduct = {
  id: number;
  slug: string;
  name: string;
  subtitle: string | null;
  coverImage: string | null;
  categoryId: number | null;
  categoryName: string | null;
  price: string;
  availableStock: number | null;
  deliveryType?: "CARD_AUTO" | "FIXED_CARD" | "MANUAL" | "EXPRESS" | "SUPPLIER";
};

export type StorefrontHomeCategory = {
  id: number;
  name: string;
  slug?: string;
  icon?: string | null;
};

export type StorefrontHomeBanner = {
  id: number;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
};

export type StorefrontHomeSite = {
  name: string;
  subtitle: string | null;
  logo: string | null;
  notice: string | null;
};
