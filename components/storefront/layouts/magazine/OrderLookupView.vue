<script lang="ts" setup>
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
</script>
<template>
  <StorefrontPageChrome max-width-class="max-w-5xl" header-class="min-h-16" main-class="min-h-screen bg-gradient-to-b from-muted/40 to-background" section-class="px-5 pb-12 pt-26">
    <slot />
  </StorefrontPageChrome>
</template>
