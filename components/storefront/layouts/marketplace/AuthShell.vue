<script lang="ts" setup>
import StorefrontPreferences from "@/components/storefront/StorefrontPreferences.vue";
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
    <div class="absolute right-4 top-4 z-10"><StorefrontPreferences /></div>
    <div class="hidden"><slot name="aside" /></div>
    <div class="w-full max-w-md">
      <slot />
    </div>
  </main>
</template>
