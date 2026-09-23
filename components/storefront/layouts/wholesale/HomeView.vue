<template>
  <main
    data-storefront-layout="wholesale"
    class="min-h-screen bg-background text-foreground"
  >
    <!-- 顶栏：工具链风格，对齐批发站 -->
    <div class="border-b border-border bg-muted/40">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-end gap-x-3 gap-y-1 px-4 py-1.5 text-xs text-muted-foreground sm:px-5">
        <template v-if="!user">
          <a href="/login" class="hover:text-foreground">登录</a>
          <span aria-hidden="true">|</span>
          <a href="/signup" class="hover:text-foreground">注册</a>
          <span aria-hidden="true">|</span>
        </template>
        <a :href="orderHref" class="hover:text-foreground">{{ user ? "我的订单" : "订单查询" }}</a>
        <template v-if="user">
          <span aria-hidden="true">|</span>
          <a href="/account" class="hover:text-foreground">账户设置</a>
        </template>
      </div>
    </div>

    <header class="sticky top-0 z-40 border-b border-border bg-card">
      <div class="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-5">
        <a href="/" class="flex min-w-0 items-center gap-2.5 font-semibold">
          <img :src="brandLogoUrl" :alt="`${site.name} Logo`" class="size-8 shrink-0 rounded object-contain" />
          <span class="truncate text-[15px]">{{ site.name }}</span>
        </a>
        <div class="flex min-w-0 items-center gap-2">
          <div class="relative hidden w-52 sm:block md:w-64">
            <SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="queryModel"
              class="h-8 border-border bg-muted/50 pl-8 text-sm"
              :placeholder="messages.storefront.searchProducts"
              :aria-label="messages.storefront.searchProducts"
            />
          </div>
          <PublicNav />
        </div>
      </div>
    </header>

    <div class="mx-auto grid w-full max-w-6xl gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <!-- 商家公告 -->
      <aside class="h-fit rounded-md border border-border bg-card lg:sticky lg:top-[4.25rem]">
        <div class="border-b border-border bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
          商家公告
        </div>
        <div class="p-3">
          <SiteNoticeBanner
            :html="site.notice"
            :fallback="site.subtitle || messages.storefront.fallbackSubtitle"
            variant="block"
            :lines="6"
            dialog-title="商家公告"
            fallback-class="m-0 text-sm leading-6 text-muted-foreground"
          />
          <p v-if="site.subtitle && site.notice" class="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">{{ site.subtitle }}</p>
        </div>
        <div class="border-t border-border p-3">
          <a
            :href="orderHref"
            class="flex w-full items-center justify-center rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground hover:bg-muted/80"
          >
            订单查询
          </a>
        </div>
      </aside>

      <div class="min-w-0">
        <div class="relative mb-3 sm:hidden">
          <SearchIcon class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="queryModel" class="h-8 border-border bg-card pl-8 text-sm" :placeholder="messages.storefront.searchProducts" />
        </div>

        <!-- 分类条 -->
        <nav class="mb-3 flex flex-wrap gap-1.5" :aria-label="messages.storefront.categories">
          <button
            type="button"
            class="rounded border px-2.5 py-1 text-xs font-medium transition-colors"
            :class="selectedCategory === null ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50'"
            @click="selectedCategoryModel = null"
          >
            {{ messages.storefront.all }} ({{ products.length }})
          </button>
          <button
            v-for="category in categories"
            :key="category.id"
            type="button"
            class="rounded border px-2.5 py-1 text-xs font-medium transition-colors"
            :class="selectedCategory === category.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground hover:border-primary/50'"
            @click="selectedCategoryModel = category.id"
          >
            {{ category.name }} ({{ categoryCounts.get(category.id) ?? 0 }})
          </button>
        </nav>

        <p class="mb-2 text-xs text-muted-foreground">
          ▼ 点击商品名称可阅读商品介绍，确认规则后再下单
        </p>

        <!-- 密集商品表 -->
        <section class="overflow-hidden rounded-md border border-border bg-card">
          <div class="hidden grid-cols-[minmax(0,1fr)_5.5rem_6rem_5.5rem] gap-2 border-b border-border bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground sm:grid">
            <span>商品名称</span>
            <span class="text-right">库存</span>
            <span class="text-right">价格</span>
            <span class="text-right">操作</span>
          </div>

          <article
            v-for="product in visibleProducts"
            :key="product.id"
            class="border-b border-border last:border-b-0"
            :class="expandedSlug === product.slug ? 'bg-primary/5' : ''"
          >
            <div class="grid items-center gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1fr)_5.5rem_6rem_5.5rem]">
              <div class="flex min-w-0 items-start gap-2.5">
                <div class="mt-0.5 size-10 shrink-0 overflow-hidden rounded border border-border bg-muted sm:size-11">
                  <img :src="product.coverImage || defaultProductImage" :alt="product.name" class="size-full object-cover" />
                </div>
                <div class="min-w-0 flex-1">
                  <button
                    type="button"
                    class="text-left text-sm font-semibold leading-5 text-primary hover:underline"
                    :aria-expanded="expandedSlug === product.slug"
                    @click="toggleExpand(product.slug)"
                  >
                    {{ product.name }}
                  </button>
                  <p v-if="product.subtitle" class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{{ product.subtitle }}</p>
                  <p v-if="deliveryTypeLabel(product.deliveryType)" class="mt-0.5 text-[11px] text-muted-foreground sm:hidden">
                    {{ deliveryTypeLabel(product.deliveryType) }} · {{ stockLabel(product) }}
                  </p>
                </div>
              </div>
              <p class="hidden text-right text-xs sm:block" :class="stockClass(product)">{{ stockLabel(product) }}</p>
              <p class="storefront-price text-right text-sm font-semibold tabular-nums sm:block">¥{{ product.price }}</p>
              <div class="flex justify-end">
                <a
                  :href="`/product/${product.slug}`"
                  class="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  立即购买
                </a>
              </div>
            </div>

            <!-- 展开：商品介绍 -->
            <div v-if="expandedSlug === product.slug" class="border-t border-border bg-card px-3 py-3 sm:px-4">
              <div v-if="expandLoading && expandSlug === product.slug" class="py-4 text-center text-sm text-muted-foreground">
                加载介绍中…
              </div>
              <div v-else-if="expandError && expandSlug === product.slug" class="py-3 text-sm text-destructive">
                {{ expandError }}
              </div>
              <template v-else-if="expandDetail && expandSlug === product.slug">
                <h3 class="text-sm font-semibold text-foreground">商品详情</h3>
                <p v-if="expandDetail.subtitle" class="mt-1 text-xs text-muted-foreground">{{ expandDetail.subtitle }}</p>
                <!-- eslint-disable vue/no-v-html -->
                <div
                  v-if="expandDetail.description"
                  class="product-rich-content mt-3 max-h-[22rem] overflow-y-auto text-sm leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-base [&_h2]:font-bold [&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-sm [&_h3]:font-semibold [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
                  v-html="expandDetail.description"
                />
                <!-- eslint-enable vue/no-v-html -->
                <p v-else class="mt-3 text-sm text-muted-foreground">暂无详细介绍</p>
                <div class="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    :href="`/product/${product.slug}`"
                    class="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                  >
                    确认并购买
                  </a>
                  <button type="button" class="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground hover:bg-muted" @click="expandedSlug = null">
                    收起
                  </button>
                </div>
              </template>
            </div>
          </article>

          <div v-if="!visibleProducts.length" class="px-4 py-16 text-center">
            <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
            <h3 class="mt-3 text-sm font-semibold">{{ messages.storefront.noProducts }}</h3>
            <p class="mt-1 text-xs text-muted-foreground">{{ messages.storefront.noProductsDescription }}</p>
          </div>
        </section>
      </div>
    </div>

    <StorefrontFooter />
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { PackageOpenIcon, SearchIcon } from "@lucide/vue";
import { usePageContext } from "vike-vue/usePageContext";
import PublicNav from "@/components/storefront/PublicNav.vue";
import SiteNoticeBanner from "@/components/storefront/SiteNoticeBanner.vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import { Input } from "@/components/ui/input";
import type { StorefrontHomeProduct, StorefrontHomeCategory, StorefrontHomeBanner, StorefrontHomeSite } from "@/lib/storefront-templates/home-types";
import { deliveryTypeLabel } from "@/lib/storefront-templates/delivery-label";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";
import { runTelefunc, userErrorMessage } from "@/lib/telefunc-client";
import { onGetPublicProductCheckout } from "@/server/catalog/public-product.telefunc";

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
const pageContext = usePageContext() as { user?: { id: string } | null };
const user = pageContext.user ?? null;
const orderHref = computed(() => (user ? "/account/order" : "/order"));

const expandedSlug = ref<string | null>(null);
const expandSlug = ref<string | null>(null);
const expandLoading = ref(false);
const expandError = ref("");
const expandDetail = ref<{ subtitle: string | null; description: string | null } | null>(null);
const expandCache = new Map<string, { subtitle: string | null; description: string | null }>();

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

async function toggleExpand(slug: string) {
  if (expandedSlug.value === slug) {
    expandedSlug.value = null;
    return;
  }
  expandedSlug.value = slug;
  expandSlug.value = slug;
  expandError.value = "";
  const cached = expandCache.get(slug);
  if (cached) {
    expandDetail.value = cached;
    return;
  }
  expandLoading.value = true;
  expandDetail.value = null;
  try {
    const data = await runTelefunc(() => onGetPublicProductCheckout({ slug }), { notifyError: false });
    const detail = { subtitle: data.subtitle ?? null, description: data.description ?? null };
    expandCache.set(slug, detail);
    if (expandSlug.value === slug) expandDetail.value = detail;
  } catch (cause) {
    if (expandSlug.value === slug) expandError.value = userErrorMessage(cause, "加载商品介绍失败");
  } finally {
    if (expandSlug.value === slug) expandLoading.value = false;
  }
}

function stockLabel(product: StorefrontHomeProduct) {
  if (product.availableStock === null) return messages.value.storefront.stockAvailable;
  return product.availableStock > 0
    ? t(messages.value.storefront.stockCount, { count: product.availableStock })
    : messages.value.storefront.outOfStock;
}

function stockClass(product: StorefrontHomeProduct) {
  return product.availableStock === 0 ? "text-destructive" : "text-foreground";
}
</script>
