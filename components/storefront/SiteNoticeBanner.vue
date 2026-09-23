<template>
  <p v-if="!hasNotice && fallbackText" :class="fallbackClass">{{ fallbackText }}</p>
  <template v-else-if="hasNotice">
    <div
      role="button"
      tabindex="0"
      :class="triggerClass"
      :aria-label="`查看${dialogTitle}`"
      @click="open = true"
      @keydown.enter.prevent="open = true"
      @keydown.space.prevent="open = true"
    >
      <slot name="icon" />
      <!-- `html` is sanitized server-side by sanitizeProductDescription(). -->
      <!-- eslint-disable vue/no-v-html -->
      <div
        :class="previewClass"
        v-html="html"
      />
      <!-- eslint-enable vue/no-v-html -->
      <span :class="detailClass">详情</span>
    </div>

    <Dialog v-model:open="open">
      <DialogContent class="max-h-[min(80vh,40rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader class="border-b px-6 py-4">
          <DialogTitle>{{ dialogTitle }}</DialogTitle>
          <DialogDescription class="sr-only">{{ previewText }}</DialogDescription>
        </DialogHeader>
        <div class="max-h-[min(60vh,32rem)] overflow-y-auto px-6 py-4">
          <!-- eslint-disable vue/no-v-html -->
          <div :class="richContentClass" v-html="html" />
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </DialogContent>
    </Dialog>
  </template>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isEmptyHtml, plainTextFromHtml } from "@/lib/html-plain-text";
import { cn } from "@/lib/utils";

const LINE_CLAMP: Record<number, string> = {
  1: "line-clamp-1",
  2: "line-clamp-2",
  3: "line-clamp-3",
  4: "line-clamp-4",
  5: "line-clamp-5",
  6: "line-clamp-6",
};

const RICH_CONTENT = "notice-rich-content text-sm leading-6 text-foreground [&_a]:pointer-events-none [&_a]:text-primary [&_a]:underline [&_blockquote]:my-1 [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-2 [&_blockquote]:text-muted-foreground [&_h1]:my-1 [&_h1]:text-base [&_h1]:font-bold [&_h2]:my-1 [&_h2]:text-sm [&_h2]:font-bold [&_h3]:my-1 [&_h3]:text-sm [&_h3]:font-semibold [&_img]:my-1 [&_img]:inline-block [&_img]:max-h-10 [&_img]:max-w-[6rem] [&_img]:rounded [&_img]:object-cover [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-0.5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

const RICH_CONTENT_FULL = "notice-rich-content text-sm leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-[1.1rem] [&_h3]:font-semibold [&_img]:my-3 [&_img]:block [&_img]:max-w-full [&_img]:rounded-lg [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6";

const props = withDefaults(defineProps<{
  html?: string | null;
  fallback?: string | null;
  variant?: "inline" | "block";
  /** When true, preview fills parent height and clips by overflow instead of line-clamp. */
  fill?: boolean;
  lines?: number;
  dialogTitle?: string;
  class?: string;
  previewClass?: string;
  fallbackClass?: string;
}>(), {
  html: null,
  fallback: null,
  variant: "inline",
  fill: false,
  lines: undefined,
  dialogTitle: "站点公告",
  class: undefined,
  previewClass: undefined,
  fallbackClass: "m-0 text-sm text-muted-foreground",
});

const open = ref(false);
const hasNotice = computed(() => !isEmptyHtml(props.html));
const previewText = computed(() => plainTextFromHtml(props.html, 160));
const fallbackText = computed(() => props.fallback?.trim() || "");
const lineCount = computed(() => props.lines ?? (props.variant === "block" ? 3 : 1));
const richContentClass = RICH_CONTENT_FULL;

const triggerClass = computed(() => cn(
  "group flex w-full min-w-0 cursor-pointer items-center gap-2 text-left text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground",
  props.variant === "block" && "items-start",
  props.fill && "h-full flex-col items-stretch",
  props.class,
));

const previewClass = computed(() => cn(
  "min-w-0 flex-1 overflow-hidden",
  RICH_CONTENT,
  props.fill
    ? "min-h-0"
    : (LINE_CLAMP[Math.min(Math.max(lineCount.value, 1), 6)] ?? "line-clamp-3"),
  props.previewClass,
));

const detailClass = computed(() => cn(
  "shrink-0 text-xs font-medium text-primary",
  props.fill ? "mt-2 self-end" : "self-center",
));
</script>
