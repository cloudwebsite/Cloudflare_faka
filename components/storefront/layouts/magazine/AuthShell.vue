<script lang="ts" setup>
import StorefrontPreferences from "@/components/storefront/StorefrontPreferences.vue";
</script>

<template>
  <main class="min-h-screen bg-gradient-to-b from-muted/60 to-background p-4 sm:p-8">
    <div class="absolute right-4 top-4 z-10"><StorefrontPreferences /></div>
    <div class="mx-auto mb-8 max-w-lg text-center lg:mb-12">
      <div class="hidden lg:block"><slot name="aside" /></div>
    </div>
    <div class="mx-auto flex max-w-md justify-center">
      <slot />
    </div>
  </main>
</template>
