<script lang="ts" setup>
import StorefrontBrand from "@/components/storefront/StorefrontBrand.vue";
import PublicNav from "@/components/storefront/PublicNav.vue";

withDefaults(defineProps<{ maxWidthClass?: string; headerClass?: string; mainClass?: string; sectionClass?: string }>(), {
  maxWidthClass: "max-w-6xl",
  headerClass: "min-h-16",
  mainClass: "min-h-screen bg-muted/30",
  sectionClass: "px-5 pb-12 pt-26",
});
</script>

<template>
  <main :class="mainClass">
    <header class="fixed inset-x-0 top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div class="mx-auto flex items-center justify-between px-5" :class="[maxWidthClass, headerClass]">
        <StorefrontBrand />
        <PublicNav />
      </div>
    </header>
    <section class="mx-auto" :class="[maxWidthClass, sectionClass]">
      <slot />
    </section>
  </main>
</template>
