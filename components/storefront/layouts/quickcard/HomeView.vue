<template>
  <main
    data-storefront-layout="quickcard"
    class="min-h-screen bg-muted/30 text-foreground"
  >
    <header class="storefront-header-soft sticky top-0 z-40 border-b border-border">
      <div class="mx-auto flex min-h-16 max-w-[75rem] items-center gap-3 px-4 sm:px-5">
        <a href="/" class="flex min-w-0 items-center gap-2.5 font-semibold">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-9 shrink-0 rounded-lg object-contain" />
          <span class="min-w-0">
            <span class="block truncate text-[15px] text-foreground">{{ site.name }}</span>
            <span v-if="site.subtitle" class="block truncate text-xs text-primary">{{ site.subtitle }}</span>
          </span>
        </a>
        <div class="relative ml-auto hidden min-w-0 max-w-xs flex-1 sm:block md:max-w-sm">
          <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="queryModel"
            class="h-9 border-border bg-card/80 pl-9"
            :placeholder="messages.storefront.searchProducts"
            :aria-label="messages.storefront.searchProducts"
          />
        </div>
        <div class="flex shrink-0 items-center">
          <PublicNav />
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-[75rem] px-4 pb-16 pt-5 sm:px-5">
      <div class="relative mb-4 sm:hidden">
        <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="queryModel" class="h-9 border-border bg-card pl-9" :placeholder="messages.storefront.searchProducts" />
      </div>

      <!-- 站点公告 -->
      <section class="mb-3.5 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5">
        <h2 class="text-sm font-semibold text-foreground">站点公告</h2>
        <div class="mt-2">
          <SiteNoticeBanner
            :html="site.notice"
            :fallback="site.subtitle || messages.storefront.fallbackSubtitle"
            variant="block"
            :lines="3"
            fallback-class="m-0 text-sm leading-7 text-muted-foreground"
          />
        </div>
      </section>
      <!-- 选分类 + 选商品 -->
      <section class="rounded-lg border border-border bg-card p-4 shadow-[0_7px_29px_0_rgba(18,52,91,0.08)] sm:p-5">
        <div class="flex items-center gap-2">
          <span class="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          <h2 class="text-sm font-semibold text-foreground">选择分类</h2>
        </div>
        <div class="mt-3 flex flex-wrap gap-3" :aria-label="messages.storefront.categories">
          <button
            type="button"
            class="min-h-14 min-w-[9.5rem] rounded-md border px-4 py-2.5 text-left transition-colors"
            :class="selectedCategory === null
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-muted/50 text-foreground hover:border-primary/40 hover:bg-primary/5'"
            @click="selectedCategoryModel = null"
          >
            <span class="block text-sm font-semibold">{{ messages.storefront.all }}</span>
            <span class="mt-0.5 block text-xs opacity-80">共有 {{ products.length }} 件商品</span>
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="min-h-14 min-w-[9.5rem] max-w-full rounded-md border px-4 py-2.5 text-left transition-colors"
            :class="selectedCategory === category.id
              ? 'border-primary bg-primary text-primary-foreground shadow-sm'
              : 'border-border bg-muted/50 text-foreground hover:border-primary/40 hover:bg-primary/5'"
            @click="selectedCategoryModel = category.id"
          >
            <span class="flex items-center gap-2">
              <span
                v-if="isIconUrl(category.icon)"
                class="size-5 shrink-0 overflow-hidden rounded"
                :class="selectedCategory === category.id ? 'bg-primary-foreground/20' : 'bg-background'"
              >
                <img :src="category.icon!" :alt="category.name" class="size-full object-cover" />
              </span>
              <span class="block truncate text-sm font-semibold">{{ category.name }}</span>
            </span>
            <span class="mt-0.5 block text-xs opacity-80">共有 {{ categoryCounts.get(category.id) ?? 0 }} 件商品</span>
          </button>
        </div>

        <div class="mt-6 flex items-center gap-2">
          <span class="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          <h2 class="text-sm font-semibold text-foreground">选择商品</h2>
        </div>
        <div v-if="visibleProducts.length" class="mt-3 flex flex-wrap gap-3">
          <button
            v-for="product in visibleProducts"
            :key="product.id"
            type="button"
            class="min-h-14 min-w-[11rem] max-w-full rounded-md border px-4 py-2.5 text-left transition-colors"
            :class="selectedSlug === product.slug
              ? 'border-primary bg-primary/10 shadow-[inset_0_0_0_1px_var(--primary)]'
              : 'border-border bg-muted/40 hover:border-primary/40 hover:bg-primary/5'"
            @click="selectedSlug = product.slug"
          >
            <span class="block line-clamp-2 text-sm font-semibold leading-5 text-foreground">{{ product.name }}</span>
            <span class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              <span class="storefront-price font-semibold tabular-nums">¥ {{ product.price }}</span>
              <span :class="stockClass(product)">{{ stockLabel(product) }}</span>
              <span v-if="deliveryTypeLabel(product.deliveryType)" class="text-muted-foreground">{{ deliveryTypeLabel(product.deliveryType) }}</span>
            </span>
          </button>
        </div>
        <div v-else class="mt-4 rounded-md border border-dashed border-border px-4 py-10 text-center">
          <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
          <h3 class="mt-3 text-sm font-semibold text-foreground">{{ messages.storefront.noProducts }}</h3>
          <p class="mt-1 text-xs text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
        </div>
      </section>

      <!-- 商品详情 + 下单（选中后展开，对齐演示站） -->
      <section v-if="selectedSlug" class="mt-3.5">
        <ProductPurchasePanel :slug="selectedSlug" layout="quickcard" />
      </section>

      <StorefrontFooter class="mt-8" />
    </div>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { PackageOpenIcon, SearchIcon } from "@lucide/vue";
import ProductPurchasePanel from "@/components/storefront/ProductPurchasePanel.vue";
import PublicNav from "@/components/storefront/PublicNav.vue";
import SiteNoticeBanner from "@/components/storefront/SiteNoticeBanner.vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import { Input } from "@/components/ui/input";
import type { StorefrontHomeProduct, StorefrontHomeCategory, StorefrontHomeBanner, StorefrontHomeSite } from "@/lib/storefront-templates/home-types";
import { deliveryTypeLabel } from "@/lib/storefront-templates/delivery-label";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

const props = defineProps<{
  site: StorefrontHomeSite;
  products: StorefrontHomeProduct[];
  categories: StorefrontHomeCategory[];
  banners?: StorefrontHomeBanner[];
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
const selectedSlug = ref<string | null>(null);

const queryModel = computed({
  get: () => props.query,
  set: (value: string) => emit("update:query", value),
});

const selectedCategoryModel = computed({
  get: () => props.selectedCategory,
  set: (value: number | null) => emit("update:selectedCategory", value),
});

const categoryCounts = computed(() => {
  const counts = new Map<number, number>();
  for (const product of props.products) {
    if (product.categoryId == null) continue;
    counts.set(product.categoryId, (counts.get(product.categoryId) ?? 0) + 1);
  }
  return counts;
});

watch(
  () => props.visibleProducts,
  (list) => {
    if (!list.length) {
      selectedSlug.value = null;
      return;
    }
    if (!selectedSlug.value || !list.some((item) => item.slug === selectedSlug.value)) {
      selectedSlug.value = list[0]?.slug ?? null;
    }
  },
  { immediate: true },
);

function isIconUrl(icon?: string | null) {
  if (!icon) return false;
  return /^(https?:|data:|\/)/i.test(icon) || /\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(icon);
}

function stockLabel(product: StorefrontHomeProduct) {
  if (product.availableStock === null) return messages.value.storefront.stockAvailable;
  return product.availableStock > 0
    ? t(messages.value.storefront.stockCount, { count: product.availableStock })
    : messages.value.storefront.outOfStock;
}

function stockClass(product: StorefrontHomeProduct) {
  return product.availableStock === 0 ? "text-destructive" : "text-primary";
}
</script>
