<template>
  <main class="flex min-h-screen flex-col bg-muted/30">
    <header class="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex min-h-12 max-w-6xl items-center justify-between gap-3 px-4">
        <a href="/" class="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-7 shrink-0 rounded-md object-contain" />
          <span class="truncate">{{ site.name }}</span>
        </a>
        <div class="flex shrink-0 items-center gap-2">
          <PublicNav />
        </div>
      </div>
    </header>

    <div class="h-12 shrink-0" aria-hidden="true" />

    <div class="sticky top-12 z-40 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2">
        <div class="relative min-w-0 flex-1">
          <SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="queryModel" class="h-8 pl-8 text-sm" :placeholder="messages.storefront.searchProducts" :aria-label="messages.storefront.searchProducts" />
        </div>
        <div v-if="categories.length" class="hidden max-w-[55%] gap-1.5 overflow-x-auto sm:flex" :aria-label="messages.storefront.categories">
          <Button size="sm" class="h-7 shrink-0 px-2 text-xs" :variant="selectedCategory === null ? 'default' : 'outline'" @click="selectedCategoryModel = null">{{ messages.storefront.all }}</Button>
          <Button
            v-for="category in categories"
            :key="category.id"
            size="sm"
            class="h-7 shrink-0 px-2 text-xs"
            :variant="selectedCategory === category.id ? 'default' : 'outline'"
            @click="selectedCategoryModel = category.id"
          >
            {{ category.name }}
          </Button>
        </div>
      </div>
      <div v-if="categories.length" class="flex gap-1.5 overflow-x-auto px-4 pb-2 sm:hidden" :aria-label="messages.storefront.categories">
        <Button size="sm" class="h-7 shrink-0 px-2 text-xs" :variant="selectedCategory === null ? 'default' : 'outline'" @click="selectedCategoryModel = null">{{ messages.storefront.all }}</Button>
        <Button
          v-for="category in categories"
          :key="category.id"
          size="sm"
          class="h-7 shrink-0 px-2 text-xs"
          :variant="selectedCategory === category.id ? 'default' : 'outline'"
          @click="selectedCategoryModel = category.id"
        >
          {{ category.name }}
        </Button>
      </div>
    </div>

    <section class="mx-auto w-full max-w-6xl flex-1 px-4 py-4">
      <SiteNoticeBanner
        v-if="site.notice"
        :html="site.notice"
        class="mb-3"
      >
        <template #icon>
          <InfoIcon class="size-3.5 shrink-0 text-foreground" />
        </template>
      </SiteNoticeBanner>
      <p v-else-if="site.subtitle" class="mb-3 text-xs text-muted-foreground">{{ site.subtitle }}</p>

      <div v-if="visibleProducts.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <article v-for="product in visibleProducts" :key="product.id" class="group overflow-hidden rounded-md border bg-card transition-shadow hover:shadow-md">
          <a :href="`/product/${product.slug}`" class="block">
            <div class="relative aspect-square overflow-hidden bg-muted">
              <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <Badge variant="secondary" class="absolute right-1.5 top-1.5 bg-background/90 px-1.5 py-0 text-[10px] backdrop-blur" :class="stockClass(product)">{{ stockLabel(product) }}</Badge>
            </div>
            <div class="flex flex-col gap-0.5 p-2">
              <h3 class="line-clamp-2 text-xs font-medium leading-snug tracking-normal">{{ product.name }}</h3>
              <span class="mt-1 text-base font-semibold tabular-nums">¥{{ product.price }}</span>
            </div>
          </a>
        </article>
      </div>

      <div v-else class="border border-dashed bg-background px-4 py-12 text-center">
        <PackageOpenIcon class="mx-auto size-7 text-muted-foreground" />
        <h3 class="mt-3 text-sm font-semibold">{{ messages.storefront.noProducts }}</h3>
        <p class="mt-1.5 text-xs text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
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
import { Button } from "@/components/ui/button";
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
