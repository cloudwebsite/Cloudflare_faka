<template>
  <StorefrontPageChrome>
    <nav class="mb-6 text-sm text-muted-foreground">
      <a :href="listHref" class="hover:text-foreground hover:underline">{{ listLabel }}</a>
      <span class="mx-2">/</span>
      <span class="text-foreground">{{ article.title }}</span>
    </nav>

    <article>
      <header class="mb-6">
        <div class="flex flex-wrap items-center gap-2">
          <span v-if="article.pinned" class="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">置顶</span>
          <h1 class="text-3xl font-semibold tracking-tight">{{ article.title }}</h1>
        </div>
        <p v-if="article.publishedAt" class="mt-3 text-sm text-muted-foreground">{{ formatDate(article.publishedAt) }}</p>
        <p v-if="article.summary" class="mt-3 text-sm leading-6 text-muted-foreground">{{ article.summary }}</p>
      </header>

      <img
        v-if="article.coverImage"
        :src="article.coverImage"
        :alt="article.title"
        class="mb-8 aspect-video w-full rounded-xl border object-cover"
      />

      <!-- bodyHtml is sanitized server-side by sanitizeProductDescription(). -->
      <div
        class="product-rich-content text-sm leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-[1.1rem] [&_h3]:font-semibold [&_img]:my-4 [&_img]:block [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
        v-html="article.bodyHtml"
      />
    </article>

    <StorefrontFooter class="mt-12" />
  </StorefrontPageChrome>
</template>

<script lang="ts" setup>
import StorefrontFooter from "@/components/storefront/StorefrontFooter.vue";
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
import type { PublicArticleDetail } from "@/server/content/public";

defineProps<{
  article: PublicArticleDetail;
  listHref: string;
  listLabel: string;
}>();

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
