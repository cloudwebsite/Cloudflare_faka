<template>
  <main
    data-storefront-layout="duocai"
    class="flex min-h-screen flex-col bg-background text-foreground"
  >
    <header class="storefront-header-brand sticky top-0 z-50">
      <div class="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
        <a href="/" class="flex min-w-0 items-center gap-2.5 font-semibold">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-9 shrink-0 rounded-md bg-background object-contain p-0.5" />
          <span class="truncate">{{ site.name }}</span>
        </a>
        <div class="nav-on-brand flex shrink-0 items-center">
          <PublicNav />
        </div>
      </div>
    </header>

    <div class="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-5">
      <div class="grid items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="min-w-0 overflow-hidden">
          <StorefrontBannerCarousel
            :banners="banners ?? []"
            :title="site.name"
            :subtitle="site.subtitle"
            fill
            object-fit="cover"
          />
        </div>
        <aside class="flex min-h-36 min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card p-4 lg:h-auto">
          <div class="flex shrink-0 items-center gap-2 text-sm font-semibold text-primary">
            <MegaphoneIcon class="size-4" />
            店铺公告
          </div>
          <div class="mt-3 flex min-h-0 flex-1 flex-col">
            <SiteNoticeBanner
              :html="site.notice"
              :fallback="site.subtitle || messages.storefront.fallbackSubtitle"
              variant="block"
              fill
              dialog-title="店铺公告"
              fallback-class="m-0 text-sm leading-6 text-muted-foreground"
              class="h-full min-h-0"
            />
          </div>
        </aside>
      </div>

      <nav class="mt-6 flex gap-4 overflow-x-auto pb-1" :aria-label="messages.storefront.categories">
        <button type="button" class="flex w-16 shrink-0 flex-col items-center gap-2" @click="selectedCategoryModel = null">
          <span
            class="flex size-14 items-center justify-center rounded-full text-sm font-semibold"
            :class="selectedCategory === null ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'bg-primary/10 text-primary'"
          >
            <LayoutGridIcon class="size-5" />
          </span>
          <span class="line-clamp-1 text-xs" :class="selectedCategory === null ? 'font-semibold text-primary' : 'text-muted-foreground'">{{ messages.storefront.all }}</span>
        </button>
        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="flex w-16 shrink-0 flex-col items-center gap-2"
          @click="selectedCategoryModel = category.id"
        >
          <span
            class="flex size-14 items-center justify-center overflow-hidden rounded-full text-sm font-semibold"
            :class="selectedCategory === category.id ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' : 'bg-primary/10 text-primary'"
          >
            <img v-if="isIconUrl(category.icon)" :src="category.icon!" :alt="category.name" class="size-full object-cover" />
            <span v-else>{{ categoryMark(category) }}</span>
          </span>
          <span class="line-clamp-1 text-xs" :class="selectedCategory === category.id ? 'font-semibold text-primary' : 'text-muted-foreground'">{{ category.name }}</span>
        </button>
      </nav>

      <div class="mt-5 flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-3 sm:flex-row sm:items-center sm:gap-4">
        <div class="relative min-w-0 flex-1">
          <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            v-model="queryModel"
            class="h-10 border-border bg-card pl-9 focus-visible:border-primary"
            :placeholder="messages.storefront.searchProducts"
            :aria-label="messages.storefront.searchProducts"
          />
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <div class="flex gap-2 overflow-x-auto" role="group" aria-label="排序">
            <button
              v-for="option in sortOptions"
              :key="option.id"
              type="button"
              class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
              :class="sortBy === option.id ? 'bg-primary text-primary-foreground' : 'bg-card text-primary ring-1 ring-border'"
              @click="sortBy = option.id"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="flex rounded-full border border-border bg-card p-0.5" role="group" aria-label="视图切换">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              :aria-pressed="viewMode === 'grid'"
              @click="viewMode = 'grid'"
            >
              <LayoutGridIcon class="size-3.5" />
              宫格
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <ListIcon class="size-3.5" />
              列表
            </button>
          </div>
        </div>
      </div>

      <div v-if="sortedProducts.length && viewMode === 'grid'" class="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <article
          v-for="product in sortedProducts"
          :key="product.id"
          class="overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
          :class="product.availableStock === 0 ? 'opacity-70' : ''"
        >
          <a :href="`/product/${product.slug}`" class="block">
            <div class="relative aspect-square bg-muted">
              <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover" />
              <span
                v-if="deliveryTypeLabel(product.deliveryType)"
                class="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground"
                :class="isAutoDelivery(product.deliveryType) ? 'bg-primary' : 'bg-primary/60'"
              >
                {{ deliveryTypeLabel(product.deliveryType) }}
              </span>
              <div
                v-if="product.availableStock === 0"
                class="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white"
              >
                已售空
              </div>
            </div>
            <div class="p-3">
              <h3 class="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{{ product.name }}</h3>
              <p v-if="product.subtitle" class="mt-1 line-clamp-1 text-xs text-muted-foreground">{{ product.subtitle }}</p>
              <p class="mt-2 text-xs text-muted-foreground">{{ stockMeta(product) }}</p>
              <div class="mt-1.5 flex items-baseline gap-0.5">
                <span class="storefront-price text-lg font-bold tabular-nums leading-none">¥{{ product.price }}</span>
                <span class="text-[11px] text-muted-foreground">/件</span>
              </div>
            </div>
          </a>
        </article>
      </div>

      <div v-else-if="sortedProducts.length && viewMode === 'list'" class="mt-6 grid gap-3">
        <a
          v-for="product in sortedProducts"
          :key="`list-${product.id}`"
          :href="`/product/${product.slug}`"
          class="group flex gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 transition-shadow hover:shadow-md sm:gap-4 sm:p-4"
          :class="product.availableStock === 0 ? 'opacity-70' : ''"
        >
          <div class="relative size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-28">
            <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover" />
            <span
              v-if="deliveryTypeLabel(product.deliveryType)"
              class="absolute left-1.5 top-1.5 rounded px-1 py-0.5 text-[10px] font-medium text-primary-foreground"
              :class="isAutoDelivery(product.deliveryType) ? 'bg-primary' : 'bg-primary/60'"
            >
              {{ deliveryTypeLabel(product.deliveryType) }}
            </span>
          </div>
          <div class="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div class="min-w-0 flex-1">
              <h3 class="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{{ product.name }}</h3>
              <p v-if="product.subtitle" class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ product.subtitle }}</p>
              <p class="mt-1.5 text-xs text-muted-foreground">{{ stockMeta(product) }}</p>
            </div>
            <div class="flex shrink-0 items-end justify-between gap-3 sm:flex-col sm:items-end">
              <div class="flex items-baseline gap-0.5">
                <span class="storefront-price text-lg font-bold tabular-nums">¥{{ product.price }}</span>
                <span class="text-[11px] text-muted-foreground">/件</span>
              </div>
              <span class="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">立即购买</span>
            </div>
          </div>
        </a>
      </div>

      <div v-else class="mt-6 rounded-xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
        <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
        <h3 class="mt-4 text-base font-semibold text-foreground">{{ messages.storefront.noProducts }}</h3>
        <p class="mt-2 text-sm text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
      </div>
    </div>

    <StorefrontFooter />
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { LayoutGridIcon, ListIcon, MegaphoneIcon, PackageOpenIcon, SearchIcon } from "@lucide/vue";
import PublicNav from "@/components/storefront/PublicNav.vue";
import SiteNoticeBanner from "@/components/storefront/SiteNoticeBanner.vue";
import StorefrontBannerCarousel from "@/components/storefront/StorefrontBannerCarousel.vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import { Input } from "@/components/ui/input";
import type { StorefrontHomeProduct, StorefrontHomeCategory, StorefrontHomeBanner, StorefrontHomeSite } from "@/lib/storefront-templates/home-types";
import { deliveryTypeLabel } from "@/lib/storefront-templates/delivery-label";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

type SortBy = "default" | "price" | "stock";
type ViewMode = "grid" | "list";

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

const { messages } = useStorefrontPreferences();
const sortBy = ref<SortBy>("default");
const viewMode = ref<ViewMode>("grid");
const queryModel = computed({
  get: () => props.query,
  set: (value: string) => emit("update:query", value),
});

const selectedCategoryModel = computed({
  get: () => props.selectedCategory,
  set: (value: number | null) => emit("update:selectedCategory", value),
});

const sortedProducts = computed(() => {
  const list = [...props.visibleProducts];
  if (sortBy.value === "price") {
    list.sort((a, b) => Number.parseFloat(a.price) - Number.parseFloat(b.price));
  } else if (sortBy.value === "stock") {
    list.sort((a, b) => stockRank(b) - stockRank(a));
  }
  return list;
});

function stockRank(product: StorefrontHomeProduct) {
  if (product.availableStock === null) return Number.POSITIVE_INFINITY;
  return product.availableStock;
}

function isAutoDelivery(deliveryType?: StorefrontHomeProduct["deliveryType"]) {
  return deliveryType === "CARD_AUTO" || deliveryType === "FIXED_CARD";
}

function isIconUrl(icon?: string | null) {
  if (!icon) return false;
  return /^(https?:|data:|\/)/i.test(icon) || /\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(icon);
}

function categoryMark(category: StorefrontHomeCategory) {
  const icon = category.icon?.trim();
  if (icon && !isIconUrl(icon)) return icon.slice(0, 1);
  return category.name.trim().charAt(0) || "类";
}

function stockMeta(product: StorefrontHomeProduct) {
  if (product.availableStock === null) return "库存 充足";
  return `库存 ${product.availableStock}`;
}
</script>
