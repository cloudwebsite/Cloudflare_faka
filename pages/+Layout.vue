<template>
  <slot />
  <Toaster rich-colors position="top-right" :offset="16" />
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";
import "./tailwind.css";
import "@/components/storefront/skins/index.css";
import { useStorefrontSkin } from "@/lib/storefront-templates/use-storefront-skin";

useStorefrontSkin();
</script>
