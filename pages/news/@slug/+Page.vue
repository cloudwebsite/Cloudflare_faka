<template>
  <ArticleDetailView :article="data" list-href="/news" list-label="新闻资讯" />
</template>
<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import ArticleDetailView from "@/components/storefront/ArticleDetailView.vue";
import type { Data } from "./+data.server";

const data = useData<Data>();
</script>
