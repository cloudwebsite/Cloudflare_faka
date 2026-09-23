<template>
  <main class="flex min-h-screen flex-col bg-muted/30">
    <header class="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <a href="/" class="flex min-w-0 items-center gap-2 font-semibold">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-9 shrink-0 rounded-md object-contain" />
          <span class="truncate">{{ site.name }}</span>
        </a>
        <div class="flex shrink-0 items-center gap-2">
          <PublicNav />
        </div>
      </div>
    </header>

    <section class="border-b bg-background pt-16">
      <div class="mx-auto max-w-6xl px-5 py-12 sm:py-16">
        <h1 class="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">{{ site.name }}</h1>
        <p class="mt-4 max-w-2xl text-base text-muted-foreground">{{ site.subtitle || messages.storefront.fallbackSubtitle }}</p>
        <div class="relative mt-8 max-w-md">
          <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="queryModel" class="pl-9" :placeholder="messages.storefront.searchProducts" :aria-label="messages.storefront.searchProducts" />
        </div>
        <SiteNoticeBanner
          v-if="site.notice"
          :html="site.notice"
          variant="block"
          :lines="4"
          class="mt-6 max-w-2xl"
        >
          <template #icon>
            <InfoIcon class="mt-0.5 size-4 shrink-0 text-foreground" />
          </template>
        </SiteNoticeBanner>
      </div>
    </section>

    <div v-if="categories.length" class="border-b bg-background">
      <nav class="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-5 py-3 text-sm" :aria-label="messages.storefront.categories">
        <button
          type="button"
          class="shrink-0 underline-offset-4 transition-colors hover:text-foreground"
          :class="selectedCategory === null ? 'font-medium text-foreground underline' : 'text-muted-foreground'"
          @click="selectedCategoryModel = null"
        >
          {{ messages.storefront.all }}
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="shrink-0 underline-offset-4 transition-colors hover:text-foreground"
          :class="selectedCategory === category.id ? 'font-medium text-foreground underline' : 'text-muted-foreground'"
          @click="selectedCategoryModel = category.id"
        >
          {{ category.name }}
        </button>
      </nav>
    </div>

    <section class="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:py-12">
      <template v-if="visibleProducts.length && featuredProduct">
        <article class="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-lg">
          <a :href="`/product/${featuredProduct.slug}`" class="grid gap-0 sm:grid-cols-2">
            <div class="relative aspect-4/3 overflow-hidden bg-muted sm:aspect-auto sm:min-h-80">
              <img :src="featuredProduct.coverImage || defaultProductImage" :alt="featuredProduct.name" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <Badge variant="secondary" class="absolute left-3 top-3 bg-background/90 text-xs backdrop-blur">{{ featuredProduct.categoryName || messages.storefront.products }}</Badge>
            </div>
            <div class="flex flex-col justify-center p-6 sm:p-8">
              <h2 class="text-2xl font-semibold tracking-normal sm:text-3xl">{{ featuredProduct.name }}</h2>
              <p v-if="featuredProduct.subtitle" class="mt-3 text-sm text-muted-foreground">{{ featuredProduct.subtitle }}</p>
              <div class="mt-6 flex items-end justify-between gap-4">
                <span :class="stockClass(featuredProduct)" class="text-sm">{{ stockLabel(featuredProduct) }}</span>
                <span class="text-3xl font-semibold tabular-nums">¥{{ featuredProduct.price }}</span>
              </div>
            </div>
          </a>
        </article>

        <div v-if="listProducts.length" class="mt-8 divide-y border-y">
          <a
            v-for="product in listProducts"
            :key="product.id"
            :href="`/product/${product.slug}`"
            class="flex gap-4 py-4 transition-colors hover:bg-muted/40"
          >
            <div class="size-20 shrink-0 overflow-hidden rounded-md bg-muted sm:size-24">
              <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover" />
            </div>
            <div class="flex min-w-0 flex-1 flex-col justify-center">
              <h3 class="line-clamp-2 text-sm font-semibold tracking-normal sm:text-base">{{ product.name }}</h3>
              <p v-if="product.subtitle" class="mt-1 line-clamp-1 text-xs text-muted-foreground">{{ product.subtitle }}</p>
              <div class="mt-2 flex items-center justify-between gap-3">
                <span :class="stockClass(product)" class="text-xs">{{ stockLabel(product) }}</span>
                <span class="shrink-0 text-lg font-semibold tabular-nums">¥{{ product.price }}</span>
              </div>
            </div>
          </a>
        </div>
      </template>

      <div v-else class="border border-dashed bg-background px-6 py-16 text-center">
        <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
        <h3 class="mt-4 text-base font-semibold">{{ messages.storefront.noProducts }}</h3>
        <p class="mt-2 text-sm text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
      </div>
    </section>

    <StorefrontFooter />
  </main>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { InfoIcon, PackageOpenIcon, SearchIcon } from "@lucide/vue";
import PublicNav from "@/components/storefront/PublicNav.vue";
import SiteNoticeBanner from "@/components/storefront/SiteNoticeBanner.vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { StorefrontHomeProduct, StorefrontHomeCategory, StorefrontHomeSite } from "@/lib/storefront-templates/home-types";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

const props = defineProps<{
  site: StorefrontHomeSite;
  products: StorefrontHomeProduct[];
  categories: StorefrontHomeCategory[];
  banners?: import("@/lib/storefront-templates/home-types").StorefrontHomeBanner[];
  query: string;
  selectedCategory: number | null;
  visibleProducts: StorefrontHomeProduct[];
  brandLogoUrl: string;
  defaultProductImage: string;
}>();

const emit = defineEmits<{
  "update:query": [string];
  "update:selectedCategory": [number | null];
}>();

const { messages, t } = useStorefrontPreferences();

const queryModel = computed({
  get: () => props.query,
  set: (v: string) => emit("update:query", v),
});

const selectedCategoryModel = computed({
  get: () => props.selectedCategory,
  set: (v: number | null) => emit("update:selectedCategory", v),
});

const featuredProduct = computed(() => props.visibleProducts[0] ?? null);
const listProducts = computed(() => props.visibleProducts.slice(1));

function stockLabel(product: StorefrontHomeProduct) {
  if (product.availableStock === null) return messages.value.storefront.stockAvailable;
  return product.availableStock > 0
    ? t(messages.value.storefront.stockCount, { count: product.availableStock })
    : messages.value.storefront.outOfStock;
}

function stockClass(product: StorefrontHomeProduct) {
  return product.availableStock === 0 ? "text-orange-500" : "text-muted-foreground";
}
</script>
