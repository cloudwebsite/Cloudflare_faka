<template>
  <component
    :is="HomeView"
    :site="site"
    :products="data.products"
    :categories="data.categories"
    :banners="data.banners"
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
import { resolveStorefrontView } from "@/lib/storefront-templates/resolve";
import type { Data } from "./+data.server";

const data = useData<Data>();
const pageContext = usePageContext() as { site: { name: string; subtitle: string | null; logo: string | null; notice: string | null; layout?: string } };
const site = pageContext.site;
const HomeView = resolveStorefrontView("HomeView", site.layout);
const selectedCategory = ref<number | null>(null);
const query = ref("");
const brandLogoUrl = computed(() => site.logo || logoUrl);
const visibleProducts = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  return data.products.filter((product) =>
    (selectedCategory.value === null || product.categoryId === selectedCategory.value)
    && (!keyword || product.name.toLowerCase().includes(keyword) || product.subtitle?.toLowerCase().includes(keyword)),
  );
});
</script>
