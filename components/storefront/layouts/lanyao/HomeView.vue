<template>
  <main
    data-storefront-layout="lanyao"
    class="flex min-h-screen flex-col bg-muted/40 text-foreground"
  >
    <header class="sticky top-0 z-50 border-b border-border bg-card">
      <div class="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" class="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight text-foreground">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-8 shrink-0 rounded-lg object-contain" />
          <span class="truncate text-[15px]">{{ site.name }}</span>
        </a>
        <div class="flex min-w-0 items-center gap-2">
          <div class="relative hidden w-56 sm:block">
            <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="queryModel" class="h-9 border-border bg-muted pl-9" :placeholder="messages.storefront.searchProducts" :aria-label="messages.storefront.searchProducts" />
          </div>
          <PublicNav />
        </div>
      </div>
    </header>

    <!-- Hero: category rail + banner + notice -->
    <section class="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
      <div class="grid items-stretch gap-4 lg:grid-cols-[12rem_minmax(0,1fr)_16.5rem]">
        <nav class="hidden self-stretch overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-sm lg:block" :aria-label="messages.storefront.categories">
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors"
            :class="selectedCategory === null ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
            @click="selectedCategoryModel = null"
          >
            <span class="flex size-8 items-center justify-center rounded-lg" :class="selectedCategory === null ? 'bg-primary-foreground/15' : 'bg-muted'">
              <LayoutGridIcon class="size-4" />
            </span>
            {{ messages.storefront.all }}
          </button>
          <button
            v-for="category in sidebarCategories"
            :key="category.id"
            type="button"
            class="mt-1 flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors"
            :class="selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'"
            @click="selectedCategoryModel = category.id"
          >
            <span class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg text-xs font-semibold" :class="selectedCategory === category.id ? 'bg-primary-foreground/15' : 'bg-muted text-primary'">
              <img v-if="isIconUrl(category.icon)" :src="category.icon!" :alt="category.name" class="size-full object-cover" />
              <span v-else>{{ categoryMark(category) }}</span>
            </span>
            <span class="min-w-0 flex-1 truncate">{{ category.name }}</span>
            <span class="text-[11px] opacity-70">{{ categoryCounts.get(category.id) ?? 0 }}</span>
          </button>
        </nav>

        <div class="min-w-0">
          <div class="relative mb-3 sm:hidden">
            <SearchIcon class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input v-model="queryModel" class="h-9 border-border bg-card pl-9" :placeholder="messages.storefront.searchProducts" />
          </div>
          <StorefrontBannerCarousel
            :banners="banners ?? []"
            :title="site.name"
            :subtitle="site.subtitle"
            aspect-class="aspect-[16/9] sm:aspect-[2/1]"
          />
        </div>

        <aside class="flex h-full flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div class="flex shrink-0 items-center gap-2 text-sm font-semibold text-foreground">
            <MegaphoneIcon class="size-4 text-primary" />
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
    </section>

    <div v-if="site.notice" class="border-y border-border bg-card">
      <div class="mx-auto max-w-7xl px-4 py-2.5 sm:px-6">
        <SiteNoticeBanner :html="site.notice" dialog-title="店铺公告">
          <template #icon>
            <Volume2Icon class="size-4 shrink-0 text-primary" />
          </template>
        </SiteNoticeBanner>
      </div>
    </div>

    <!-- Hot products -->
    <section v-if="hotProducts.length" class="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
      <div class="mb-3 flex items-end justify-between gap-3">
        <div class="flex items-center gap-2">
          <FlameIcon class="size-4 storefront-price" />
          <div>
            <h2 class="text-lg font-semibold tracking-tight text-foreground">爆款商品</h2>
            <p class="text-xs text-muted-foreground">超值热销，畅销精选</p>
          </div>
        </div>
        <button type="button" class="text-xs font-medium text-primary hover:underline" @click="selectedCategoryModel = null">查看全部</button>
      </div>
      <div class="flex gap-3 overflow-x-auto pb-1">
        <a
          v-for="product in hotProducts"
          :key="`hot-${product.id}`"
          :href="`/product/${product.slug}`"
          class="w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div class="aspect-square bg-muted">
            <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover" />
          </div>
          <div class="p-3">
            <h3 class="line-clamp-2 text-sm font-medium leading-5 text-foreground">{{ product.name }}</h3>
            <p class="storefront-price mt-1.5 text-sm font-semibold tabular-nums">¥{{ product.price }}</p>
          </div>
        </a>
      </div>
    </section>

    <!-- Primary category wall (一级分类) -->
    <section v-if="categories.length" class="mx-auto w-full max-w-7xl px-4 pb-2 sm:px-6">
      <div class="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold tracking-tight text-foreground">商品分类</h2>
            <p class="mt-0.5 text-xs text-muted-foreground">点击分类筛选商品</p>
          </div>
          <button
            type="button"
            class="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            :class="selectedCategory === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground hover:bg-muted/80'"
            @click="selectedCategoryModel = null"
          >
            全部分类
          </button>
        </div>
        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
          <button
            v-for="category in categories"
            :key="`wall-${category.id}`"
            type="button"
            class="flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-center transition-colors"
            :class="selectedCategory === category.id ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-muted'"
            @click="selectedCategoryModel = category.id"
          >
            <span
              class="flex size-12 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold sm:size-14"
              :class="selectedCategory === category.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'"
            >
              <img v-if="isIconUrl(category.icon)" :src="category.icon!" :alt="category.name" class="size-full object-cover" />
              <span v-else>{{ categoryMark(category) }}</span>
            </span>
            <span class="line-clamp-2 w-full text-xs font-medium leading-4" :class="selectedCategory === category.id ? 'text-primary' : 'text-foreground'">
              {{ category.name }}
            </span>
            <span class="text-[10px] text-muted-foreground">{{ categoryCounts.get(category.id) ?? 0 }} 件</span>
          </button>
        </div>
      </div>
    </section>

    <!-- All products: toolbar + list/grid -->
    <section class="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold tracking-tight text-foreground">全部商品</h2>
          <p class="mt-0.5 text-xs text-muted-foreground">
            {{ query ? t(messages.storefront.relatedProducts, { count: sortedProducts.length }) : `共 ${sortedProducts.length} 件` }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex rounded-lg border border-border bg-card p-0.5 shadow-sm" role="group" aria-label="排序">
            <button
              v-for="option in sortOptions"
              :key="option.id"
              type="button"
              class="rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
              :class="sortBy === option.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'"
              @click="sortBy = option.id"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="flex rounded-lg border border-border bg-card p-0.5 shadow-sm" role="group" aria-label="视图切换">
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
          </div>
        </div>
      </div>

      <!-- List view (PC default — matches demo horizontal cards) -->
      <div v-if="sortedProducts.length && viewMode === 'list'" class="grid gap-4">
        <a
          v-for="product in sortedProducts"
          :key="`list-${product.id}`"
          :href="`/product/${product.slug}`"
          class="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md sm:min-h-[11.5rem] sm:flex-row"
        >
          <div class="relative aspect-[16/10] shrink-0 overflow-hidden bg-muted sm:aspect-auto sm:w-44 sm:self-stretch lg:w-52">
            <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <span
              v-if="deliveryTypeLabel(product.deliveryType)"
              class="absolute left-2 top-2 rounded-md bg-background/95 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm sm:hidden"
            >
              {{ deliveryTypeLabel(product.deliveryType) }}
            </span>
          </div>
          <div class="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:flex-row sm:items-stretch sm:gap-5 sm:p-5">
            <div class="min-w-0 flex-1">
              <h3 class="line-clamp-2 text-[15px] font-semibold leading-6 text-foreground">{{ product.name }}</h3>
              <p v-if="product.subtitle" class="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">{{ product.subtitle }}</p>
              <div class="mt-3 hidden grid-cols-3 gap-2 text-center text-[11px] leading-4 text-muted-foreground sm:grid sm:max-w-md">
                <div class="rounded-lg bg-muted px-2 py-2">
                  <p>库存状态</p>
                  <p class="mt-0.5 font-medium" :class="stockClass(product)">{{ stockStatusShort(product) }}</p>
                </div>
                <div class="rounded-lg bg-muted px-2 py-2">
                  <p>订单耗时</p>
                  <p class="mt-0.5 font-medium text-foreground">{{ deliverySpeedLabel(product.deliveryType) || "—" }}</p>
                </div>
                <div class="rounded-lg bg-muted px-2 py-2">
                  <p>商品类型</p>
                  <p class="mt-0.5 font-medium text-foreground">{{ deliveryTypeLabel(product.deliveryType) || "—" }}</p>
                </div>
              </div>
              <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground sm:hidden">
                <span :class="stockClass(product)">库存：{{ stockStatusShort(product) }}</span>
                <span v-if="deliverySpeedLabel(product.deliveryType)">耗时：{{ deliverySpeedLabel(product.deliveryType) }}</span>
                <span v-if="deliveryTypeLabel(product.deliveryType)">类型：{{ deliveryTypeLabel(product.deliveryType) }}</span>
              </div>
            </div>
            <div class="flex shrink-0 items-end justify-between gap-3 sm:w-36 sm:flex-col sm:items-stretch sm:justify-between sm:border-l sm:border-border sm:pl-5">
              <div>
                <p class="text-[11px] text-muted-foreground">采购价</p>
                <p class="storefront-price text-xl font-semibold tabular-nums sm:text-2xl">¥{{ product.price }}</p>
              </div>
              <span class="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground sm:w-full">
                立即购买
              </span>
            </div>
          </div>
        </a>
      </div>

      <!-- Grid view -->
      <div v-else-if="sortedProducts.length && viewMode === 'grid'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="product in sortedProducts"
          :key="product.id"
          class="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
        >
          <a :href="`/product/${product.slug}`" class="block">
            <div class="relative aspect-[4/3] bg-muted">
              <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
              <span
                v-if="deliveryTypeLabel(product.deliveryType)"
                class="absolute left-2 top-2 rounded-md bg-background/95 px-1.5 py-0.5 text-[10px] font-medium text-foreground shadow-sm"
              >
                {{ deliveryTypeLabel(product.deliveryType) }}
              </span>
            </div>
            <div class="p-4">
              <h3 class="line-clamp-2 text-[15px] font-semibold leading-6 text-foreground">{{ product.name }}</h3>
              <p v-if="product.subtitle" class="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{{ product.subtitle }}</p>
              <div class="mt-3 grid grid-cols-3 gap-1.5 text-center text-[10px] leading-4 text-muted-foreground">
                <div class="rounded-lg bg-muted px-1 py-1.5">
                  <p class="text-muted-foreground">库存状态</p>
                  <p class="mt-0.5 font-medium" :class="stockClass(product)">{{ stockStatusShort(product) }}</p>
                </div>
                <div class="rounded-lg bg-muted px-1 py-1.5">
                  <p class="text-muted-foreground">订单耗时</p>
                  <p class="mt-0.5 font-medium text-foreground">{{ deliverySpeedLabel(product.deliveryType) || "—" }}</p>
                </div>
                <div class="rounded-lg bg-muted px-1 py-1.5">
                  <p class="text-muted-foreground">商品类型</p>
                  <p class="mt-0.5 font-medium text-foreground">{{ deliveryTypeLabel(product.deliveryType) || "—" }}</p>
                </div>
              </div>
              <div class="mt-3 flex items-end justify-between gap-2">
                <p class="storefront-price text-lg font-semibold tabular-nums">¥{{ product.price }}</p>
                <span class="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">立即购买</span>
              </div>
            </div>
          </a>
        </article>
      </div>

      <div v-else class="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
        <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
        <h3 class="mt-4 text-base font-semibold text-foreground">{{ messages.storefront.noProducts }}</h3>
        <p class="mt-2 text-sm text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
      </div>
    </section>

    <StorefrontFooter />
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { FlameIcon, LayoutGridIcon, ListIcon, MegaphoneIcon, PackageOpenIcon, SearchIcon, Volume2Icon } from "@lucide/vue";
import PublicNav from "@/components/storefront/PublicNav.vue";
import SiteNoticeBanner from "@/components/storefront/SiteNoticeBanner.vue";
import StorefrontBannerCarousel from "@/components/storefront/StorefrontBannerCarousel.vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import { Input } from "@/components/ui/input";
import type { StorefrontHomeProduct, StorefrontHomeCategory, StorefrontHomeBanner, StorefrontHomeSite } from "@/lib/storefront-templates/home-types";
import { deliverySpeedLabel, deliveryTypeLabel } from "@/lib/storefront-templates/delivery-label";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

type SortId = "default" | "price" | "stock";
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

const { messages, t } = useStorefrontPreferences();
// Demo (yanshi6) defaults to list on PC; keep list as default here too.
const viewMode = ref<ViewMode>("list");
const sortBy = ref<SortId>("default");

const sortOptions: Array<{ id: SortId; label: string }> = [
  { id: "default", label: "综合" },
  { id: "price", label: "价格" },
  { id: "stock", label: "库存" },
];

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

const sidebarCategories = computed(() => props.categories.slice(0, 6));
const hotProducts = computed(() => props.products.slice(0, 7));

const sortedProducts = computed(() => {
  const list = [...props.visibleProducts];
  if (sortBy.value === "price") {
    list.sort((a, b) => Number(a.price) - Number(b.price));
  } else if (sortBy.value === "stock") {
    list.sort((a, b) => {
      const av = a.availableStock === null ? Number.POSITIVE_INFINITY : a.availableStock;
      const bv = b.availableStock === null ? Number.POSITIVE_INFINITY : b.availableStock;
      return bv - av;
    });
  }
  return list;
});

function isIconUrl(icon?: string | null) {
  if (!icon) return false;
  return /^(https?:|data:|\/)/i.test(icon) || /\.(png|jpe?g|webp|svg|gif)(\?|$)/i.test(icon);
}

function categoryMark(category: StorefrontHomeCategory) {
  const icon = category.icon?.trim();
  if (icon && !isIconUrl(icon)) return icon.slice(0, 1);
  return category.name.trim().charAt(0) || "类";
}

function stockStatusShort(product: StorefrontHomeProduct) {
  if (product.availableStock === null) return "库存充足";
  if (product.availableStock <= 0) return "库存不足";
  if (product.availableStock < 5) return "库存紧张";
  return "库存充足";
}

function stockClass(product: StorefrontHomeProduct) {
  if (product.availableStock === 0) return "text-destructive";
  if (product.availableStock !== null && product.availableStock < 5) return "text-primary";
  return "text-emerald-600 dark:text-emerald-400";
}
</script>
