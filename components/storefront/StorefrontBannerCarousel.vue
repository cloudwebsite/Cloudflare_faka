<template>
  <div :class="rootClass">
    <template v-if="banners.length">
      <a
        v-for="(banner, index) in banners"
        :key="banner.id"
        :href="banner.linkUrl || undefined"
        :class="linkClass"
        :style="index === activeIndex ? undefined : { display: 'none' }"
      >
        <img
          :src="banner.imageUrl"
          :alt="banner.title || '轮播图'"
          :class="imageClass"
        />
      </a>
      <div v-if="banners.length > 1" class="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
        <button
          v-for="(banner, index) in banners"
          :key="`dot-${banner.id}`"
          type="button"
          class="size-2 rounded-full transition-colors"
          :class="index === activeIndex ? 'bg-white' : 'bg-white/40'"
          :aria-label="`切换到第 ${index + 1} 张`"
          @click="activeIndex = index"
        />
      </div>
    </template>
    <div v-else :class="emptyClass">
      <p class="text-sm/6 text-white/80">{{ subtitle || "精选好物，即刻下单" }}</p>
      <h2 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{{ title }}</h2>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { StorefrontHomeBanner } from "@/lib/storefront-templates/home-types";
import { cn } from "@/lib/utils";

const props = withDefaults(defineProps<{
  banners: StorefrontHomeBanner[];
  title: string;
  subtitle?: string | null;
  /** Aspect ratio classes when not using fill mode. */
  aspectClass?: string;
  /** Fill parent height; image covers the full container. */
  fill?: boolean;
  /** object-fit for banner images. */
  objectFit?: "cover" | "fill" | "contain";
  class?: string;
}>(), {
  aspectClass: "aspect-[21/9] sm:aspect-[24/9]",
  fill: false,
  objectFit: "cover",
  class: undefined,
});

const activeIndex = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const fitClass = computed(() =>
  props.objectFit === "fill" ? "object-fill" : props.objectFit === "contain" ? "object-contain" : "object-cover",
);

const rootClass = computed(() => cn(
  "relative overflow-hidden rounded-xl bg-[linear-gradient(135deg,#0c6be1_0%,#1a8cff_55%,#5eb1ff_100%)] text-white",
  // Avoid h-full + aspect-ratio together: height would drive width and overflow the grid cell.
  props.fill ? cn("w-full min-w-0", props.aspectClass) : undefined,
  props.class,
));

const linkClass = computed(() =>
  props.fill ? "absolute inset-0 block overflow-hidden" : "block",
);

const imageClass = computed(() => cn(
  "w-full",
  fitClass.value,
  props.fill ? "h-full w-full max-w-none" : props.aspectClass,
));

const emptyClass = computed(() => cn(
  "flex flex-col justify-end p-6 sm:p-8",
  props.fill ? "absolute inset-0" : props.aspectClass,
));

function restart() {
  if (timer) clearInterval(timer);
  timer = null;
  if (props.banners.length <= 1) return;
  timer = setInterval(() => {
    activeIndex.value = (activeIndex.value + 1) % props.banners.length;
  }, 4500);
}

watch(() => props.banners.length, () => {
  activeIndex.value = 0;
  restart();
});

onMounted(restart);
onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
