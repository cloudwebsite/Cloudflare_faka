<script lang="ts" setup>
import Classic from "@/components/storefront/layouts/classic/AuthShell.vue";
</script>
<template>
  <Classic>
    <template #aside><slot name="aside" /></template>
    <slot />
  </Classic>
</template>
