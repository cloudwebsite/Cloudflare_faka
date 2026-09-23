<template>
  <ArticleDetailView :article="data" list-href="/help" list-label="帮助中心" />
</template>
<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import ArticleDetailView from "@/components/storefront/ArticleDetailView.vue";
import type { Data } from "./+data.server";

const data = useData<Data>();
</script>
