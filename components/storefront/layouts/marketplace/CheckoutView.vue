<script lang="ts" setup>
import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
</script>
<template>
  <StorefrontPageChrome max-width-class="max-w-xl" header-class="min-h-12" main-class="min-h-screen bg-background" section-class="px-4 pb-10 pt-20">
    <slot />
  </StorefrontPageChrome>
</template>
