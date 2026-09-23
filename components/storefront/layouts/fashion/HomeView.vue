<template>
  <main
    data-storefront-layout="fashion"
    class="flex min-h-screen flex-col bg-muted/40 text-foreground"
  >
    <header class="sticky top-0 z-50 border-b border-border bg-card">
      <div class="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
        <a href="/" class="flex min-w-0 items-center gap-2.5 font-semibold text-foreground">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-9 shrink-0 rounded-md object-contain" />
          <span class="truncate">{{ site.name }}</span>
        </a>
        <PublicNav />
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-6xl flex-1 items-start gap-5 px-4 py-6 sm:px-5 lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <aside class="hidden rounded-2xl border border-border bg-card p-4 shadow-sm lg:block">
        <a href="/" class="flex items-center gap-2.5 rounded-xl bg-primary px-3 py-3 text-primary-foreground">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-8 shrink-0 rounded-md bg-background object-contain p-0.5" />
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold">{{ site.name }}</p>
            <p v-if="site.subtitle" class="mt-0.5 line-clamp-1 text-[11px] text-primary-foreground/70">{{ site.subtitle }}</p>
          </div>
        </a>

        <div v-if="site.notice || site.subtitle" class="mt-4 rounded-xl bg-muted p-3 text-sm leading-6 text-muted-foreground">
          <div class="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <MegaphoneIcon class="size-3.5" />
            店铺公告
          </div>
          <SiteNoticeBanner
            :html="site.notice"
            :fallback="site.subtitle"
            variant="block"
            :lines="4"
            dialog-title="店铺公告"
            fallback-class="m-0 text-sm leading-6 text-muted-foreground"
          />
        </div>

        <nav class="mt-4 grid gap-1" aria-label="店铺导航">
          <a href="/" class="flex items-center gap-2 rounded-xl bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground">
            <ShoppingBagIcon class="size-4 shrink-0" />
            购买商品
          </a>
          <a :href="orderHref" class="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground hover:bg-muted">
            <ClipboardListIcon class="size-4 shrink-0" />
            订单查询
          </a>
          <a href="/" class="flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm text-foreground hover:bg-muted">
            <HomeIcon class="size-4 shrink-0" />
            返回首页
          </a>
        </nav>

        <p class="mt-5 px-1 text-xs font-semibold tracking-wide text-muted-foreground">{{ messages.storefront.categories }}</p>
        <nav class="mt-2 grid gap-1" :aria-label="messages.storefront.categories">
          <button
            type="button"
            class="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm"
            :class="selectedCategory === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
            @click="selectedCategoryModel = null"
          >
            <LayoutGridIcon class="size-4 shrink-0" />
            <span class="min-w-0 flex-1 truncate">{{ messages.storefront.all }}</span>
            <span class="text-xs opacity-70">{{ products.length }}</span>
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="flex items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm"
            :class="selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
            @click="selectedCategoryModel = category.id"
          >
            <span
              class="flex size-6 shrink-0 items-center justify-center overflow-hidden rounded-md text-[11px] font-semibold"
              :class="selectedCategory === category.id ? 'bg-primary-foreground/15' : 'bg-muted'"
            >
              <img v-if="isIconUrl(category.icon)" :src="category.icon!" :alt="category.name" class="size-full object-cover" />
              <span v-else>{{ categoryMark(category) }}</span>
            </span>
            <span class="min-w-0 flex-1 truncate">{{ category.name }}</span>
            <span class="text-xs opacity-70">{{ categoryCounts.get(category.id) ?? 0 }}</span>
          </button>
        </nav>
      </aside>

      <section class="min-w-0">
        <SiteNoticeBanner
          v-if="site.notice"
          :html="site.notice"
          class="mb-4 rounded-xl border border-border bg-card px-3 py-2"
          dialog-title="店铺公告"
        >
          <template #icon>
            <Volume2Icon class="size-4 shrink-0 text-primary" />
          </template>
        </SiteNoticeBanner>

        <StorefrontBannerCarousel
          v-if="banners?.length"
          class="mb-4"
          :banners="banners"
          :title="site.name"
          :subtitle="site.subtitle"
        />

        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div class="relative min-w-0 flex-1">
            <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="queryModel"
              class="h-10 border-border bg-card pl-9"
              :placeholder="messages.storefront.searchProducts"
              :aria-label="messages.storefront.searchProducts"
            />
          </div>
          <div class="flex rounded-lg border border-border bg-card p-0.5 shadow-sm" role="group" aria-label="视图切换">
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              :aria-pressed="viewMode === 'grid'"
              @click="viewMode = 'grid'"
            >
              <LayoutGridIcon class="size-3.5" />
              宫格
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              :aria-pressed="viewMode === 'list'"
              @click="viewMode = 'list'"
            >
              <ListIcon class="size-3.5" />
              列表
            </button>
          </div>
        </div>

        <div class="mb-1 flex gap-2 overflow-x-auto pb-1 lg:hidden" :aria-label="messages.storefront.categories">
          <button type="button" class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium" :class="chipClass(null)" @click="selectedCategoryModel = null">
            {{ messages.storefront.all }}
          </button>
          <button
            v-for="category in categories"
            :key="`m-${category.id}`"
            type="button"
            class="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium"
            :class="chipClass(category.id)"
            @click="selectedCategoryModel = category.id"
          >
            {{ category.name }}
          </button>
        </div>

        <div v-if="visibleProducts.length && viewMode === 'grid'" class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article v-for="product in visibleProducts" :key="product.id" class="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <a :href="`/product/${product.slug}`" class="block">
              <div class="relative aspect-[4/3] bg-muted">
                <img
                  :src="product.coverImage || defaultProductImage"
                  :alt="product.name"
                  class="size-full object-cover"
                  :class="product.availableStock === 0 ? 'opacity-60' : ''"
                />
                <span
                  v-if="deliveryTypeLabel(product.deliveryType)"
                  class="absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground shadow-sm"
                  :class="isAutoDelivery(product.deliveryType) ? 'bg-primary' : 'bg-primary/60'"
                >
                  {{ deliveryTypeLabel(product.deliveryType) }}
                </span>
                <div
                  v-if="product.availableStock === 0"
                  class="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-medium text-white"
                >
                  已售空
                </div>
              </div>
              <div class="p-3.5">
                <h3 class="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{{ product.name }}</h3>
                <p v-if="product.subtitle" class="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">{{ product.subtitle }}</p>
                <p class="mt-2 text-xs text-muted-foreground">
                  {{ stockMeta(product) }}
                  <template v-if="deliveryTypeLabel(product.deliveryType)"> · {{ deliveryTypeLabel(product.deliveryType) }}</template>
                </p>
                <p class="storefront-price mt-2 text-lg font-bold tabular-nums">¥{{ product.price }}</p>
              </div>
            </a>
          </article>
        </div>

        <div v-else-if="visibleProducts.length && viewMode === 'list'" class="mt-4 grid gap-3">
          <a
            v-for="product in visibleProducts"
            :key="`list-${product.id}`"
            :href="`/product/${product.slug}`"
            class="flex gap-3 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md sm:gap-4 sm:p-4"
          >
            <div class="relative size-24 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-28">
              <img
                :src="product.coverImage || defaultProductImage"
                :alt="product.name"
                class="size-full object-cover"
                :class="product.availableStock === 0 ? 'opacity-60' : ''"
              />
              <span
                v-if="deliveryTypeLabel(product.deliveryType)"
                class="absolute left-1.5 top-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground"
                :class="isAutoDelivery(product.deliveryType) ? 'bg-primary' : 'bg-primary/60'"
              >
                {{ deliveryTypeLabel(product.deliveryType) }}
              </span>
            </div>
            <div class="flex min-w-0 flex-1 flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
              <div class="min-w-0 flex-1">
                <h3 class="line-clamp-2 text-sm font-semibold leading-5 text-foreground">{{ product.name }}</h3>
                <p v-if="product.subtitle" class="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">{{ product.subtitle }}</p>
                <p class="mt-2 text-xs text-muted-foreground">
                  {{ stockMeta(product) }}
                  <template v-if="deliveryTypeLabel(product.deliveryType)"> · {{ deliveryTypeLabel(product.deliveryType) }}</template>
                </p>
              </div>
              <div class="flex shrink-0 items-end justify-between gap-3 sm:flex-col sm:items-end">
                <p class="storefront-price text-lg font-bold tabular-nums">¥{{ product.price }}</p>
                <span class="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">立即购买</span>
              </div>
            </div>
          </a>
        </div>

        <div v-else class="mt-4 rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
          <h3 class="mt-4 text-base font-semibold text-foreground">{{ messages.storefront.noProducts }}</h3>
          <p class="mt-2 text-sm text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
        </div>
      </section>
    </div>

    <StorefrontFooter />
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { ClipboardListIcon, HomeIcon, LayoutGridIcon, ListIcon, MegaphoneIcon, PackageOpenIcon, SearchIcon, ShoppingBagIcon, Volume2Icon } from "@lucide/vue";
import { usePageContext } from "vike-vue/usePageContext";
import PublicNav from "@/components/storefront/PublicNav.vue";
import SiteNoticeBanner from "@/components/storefront/SiteNoticeBanner.vue";
import StorefrontBannerCarousel from "@/components/storefront/StorefrontBannerCarousel.vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import { Input } from "@/components/ui/input";
import type { StorefrontHomeProduct, StorefrontHomeCategory, StorefrontHomeBanner, StorefrontHomeSite } from "@/lib/storefront-templates/home-types";
import { deliveryTypeLabel } from "@/lib/storefront-templates/delivery-label";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

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

const pageContext = usePageContext() as ReturnType<typeof usePageContext> & { user?: { id: string } | null };
const { messages } = useStorefrontPreferences();
const viewMode = ref<ViewMode>("grid");

const orderHref = computed(() => (pageContext.user ? "/account/order" : "/order"));
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

function chipClass(id: number | null) {
  return props.selectedCategory === id
    ? "bg-primary text-primary-foreground"
    : "bg-card text-foreground ring-1 ring-border";
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
