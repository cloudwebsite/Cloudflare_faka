<script lang="ts" setup>
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
</script>
<template>
  <StorefrontPageChrome max-width-class="max-w-6xl" header-class="min-h-16" main-class="min-h-screen bg-muted/30" section-class="px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28">
    <slot />
  </StorefrontPageChrome>
</template>
