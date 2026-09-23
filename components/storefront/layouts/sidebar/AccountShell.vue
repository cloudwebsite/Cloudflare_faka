<script lang="ts" setup>
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
</script>
<template>
  <StorefrontPageChrome max-width-class="max-w-5xl" main-class="min-h-screen bg-muted/20" section-class="flex flex-col gap-6 px-5 pb-12 pt-26">
    <slot />
  </StorefrontPageChrome>
</template>
