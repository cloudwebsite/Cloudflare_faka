<template>
  <component
    :is="HomeView"
    :site="localizedSite"
    :products="catalog.products"
    :categories="catalog.categories"
    :banners="catalog.banners"
    :query="query"
    :selected-category="selectedCategory"
    :visible-products="visibleProducts"
    :brand-logo-url="brandLogoUrl"
    :default-product-image="defaultProductImage"
    @update:query="query = $event"
    @update:selected-category="selectedCategory = $event"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import logoUrl from "@/assets/logo.svg?url";
import defaultProductImage from "@/assets/product_img.jpg?url";
import { useData } from "vike-vue/useData";
import { usePageContext } from "vike-vue/usePageContext";
import { localizePublicCatalog, localizePublicSite } from "@/lib/i18n/localize-catalog";
import { defaultStorefrontLocale, isStorefrontLocale } from "@/lib/i18n/locale";
import { resolveStorefrontView } from "@/lib/storefront-templates/resolve";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";
import type { PublicSiteSettings } from "@/server/site/public-settings";
import type { Data } from "./+data.server";

const data = useData<Data>();
const pageContext = usePageContext() as { site: PublicSiteSettings; locale?: string };
const { locale } = useStorefrontPreferences();
const activeLocale = computed(() => (isStorefrontLocale(locale.value) ? locale.value : isStorefrontLocale(pageContext.locale) ? pageContext.locale : defaultStorefrontLocale));
const localizedSite = computed(() => localizePublicSite(pageContext.site, activeLocale.value));
const catalog = computed(() => localizePublicCatalog(data, activeLocale.value));
const HomeView = resolveStorefrontView("HomeView", pageContext.site.layout);
const selectedCategory = ref<number | null>(null);
const query = ref("");
const brandLogoUrl = computed(() => pageContext.site.logo || logoUrl);
const visibleProducts = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  return catalog.value.products.filter((product) =>
    (selectedCategory.value === null || product.categoryId === selectedCategory.value)
    && (!keyword || product.name.toLowerCase().includes(keyword) || product.subtitle?.toLowerCase().includes(keyword)),
  );
});
</script>
