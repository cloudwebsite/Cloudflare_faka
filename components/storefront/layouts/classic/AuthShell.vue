<script lang="ts" setup>
import StorefrontPreferences from "@/components/storefront/StorefrontPreferences.vue";
</script>

<template>
  <main class="min-h-screen bg-muted/30 p-4 sm:p-6 lg:p-8">
    <div class="absolute right-4 top-4 z-10 sm:right-6 sm:top-6"><StorefrontPreferences /></div>
    <div class="mx-auto grid min-h-[calc(100dvh-2rem)] max-w-6xl overflow-hidden rounded-lg border bg-background shadow-sm lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1.15fr)_26rem]">
      <section class="relative hidden overflow-hidden border-r bg-muted/30 p-10 lg:flex lg:flex-col">
        <slot name="aside" />
      </section>
      <section class="flex min-w-0 items-center justify-center p-5 sm:p-8">
        <slot />
      </section>
    </div>
  </main>
</template>
