<template>
  <ArticleDetailView :article="data" list-href="/" :list-label="messages.storefront.home" />
</template>
<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import ArticleDetailView from "@/components/storefront/ArticleDetailView.vue";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";
import type { Data } from "./+data.server";

const data = useData<Data>();
const { messages } = useStorefrontPreferences();
</script>
