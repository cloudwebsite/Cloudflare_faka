<template>
  <StorefrontPageChrome>
    <div class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="mt-2 text-sm text-muted-foreground">{{ description }}</p>
    </div>

    <div v-if="!items.length" class="rounded-xl border border-dashed bg-card px-6 py-16 text-center text-sm text-muted-foreground">
      暂无内容
    </div>

    <ul v-else class="grid gap-3">
      <li v-for="item in items" :key="item.id">
        <a
          :href="`${pathPrefix}/${item.slug}`"
          class="flex gap-4 rounded-xl border bg-card p-4 transition-colors hover:border-foreground/20 hover:bg-muted/40"
        >
          <img
            v-if="item.coverImage"
            :src="item.coverImage"
            :alt="item.title"
            class="hidden h-20 w-32 shrink-0 rounded-lg object-cover sm:block"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span v-if="item.pinned" class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">置顶</span>
              <h2 class="truncate text-base font-medium text-foreground">{{ item.title }}</h2>
            </div>
            <p v-if="item.summary" class="mt-1 line-clamp-2 text-sm text-muted-foreground">{{ item.summary }}</p>
            <p v-if="item.publishedAt" class="mt-2 text-xs text-muted-foreground">{{ formatDate(item.publishedAt) }}</p>
          </div>
        </a>
      </li>
    </ul>

    <nav v-if="totalPages > 1" class="mt-8 flex items-center justify-center gap-2" aria-label="分页">
      <a
        v-if="page > 1"
        class="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        :href="pageLink(page - 1)"
      >上一页</a>
      <span class="text-sm text-muted-foreground">{{ page }} / {{ totalPages }}</span>
      <a
        v-if="page < totalPages"
        class="rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
        :href="pageLink(page + 1)"
      >下一页</a>
    </nav>

    <StorefrontFooter class="mt-12" />
  </StorefrontPageChrome>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
import type { PublicArticleListItem } from "@/server/content/public";

const props = defineProps<{
  title: string;
  description?: string;
  pathPrefix: string;
  items: PublicArticleListItem[];
  page: number;
  pageSize: number;
  total: number;
}>();

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)));

function formatDate(ms: number) {
  return new Date(ms).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function pageLink(target: number) {
  return target <= 1 ? props.pathPrefix : `${props.pathPrefix}?page=${target}`;
}
</script>
