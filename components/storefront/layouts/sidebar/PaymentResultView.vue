<script lang="ts" setup>
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
</script>
<template>
  <StorefrontPageChrome max-width-class="max-w-3xl" header-class="min-h-16" main-class="min-h-screen bg-muted/20" section-class="px-5 pb-12 pt-26">
    <slot />
  </StorefrontPageChrome>
</template>
