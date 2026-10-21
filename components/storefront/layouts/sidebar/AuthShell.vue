<script lang="ts" setup>
import StorefrontPreferences from "@/components/storefront/StorefrontPreferences.vue";
</script>

<template>
  <main class="min-h-screen bg-muted/20 p-4 sm:p-6 lg:p-0">
    <div class="absolute right-4 top-4 z-10 lg:right-8 lg:top-8"><StorefrontPreferences /></div>
    <div class="mx-auto grid min-h-dvh max-w-6xl lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="hidden border-r bg-card p-8 lg:flex lg:flex-col">
        <slot name="aside" />
      </aside>
      <section class="flex items-center justify-center p-5 sm:p-10">
        <div class="w-full max-w-md">
          <slot />
        </div>
      </section>
    </div>
  </main>
</template>
