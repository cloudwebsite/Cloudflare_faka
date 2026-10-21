<template>
  <component :is="ProductView" />
</template>

<script lang="ts" setup>
import { usePageContext } from "vike-vue/usePageContext";
import { resolveStorefrontView } from "@/lib/storefront-templates/resolve";

const pageContext = usePageContext() as { site?: { layout?: string } };
const ProductView = resolveStorefrontView("ProductView", pageContext.site?.layout);
</script>
