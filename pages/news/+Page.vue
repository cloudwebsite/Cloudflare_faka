<template>
  <ArticleListView
    :title="messages.storefront.news"
    :description="messages.storefront.newsDescription"
    path-prefix="/news"
    :items="data.items"
    :page="data.page"
    :page-size="data.pageSize"
    :total="data.total"
  />
</template>
<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import ArticleListView from "@/components/storefront/ArticleListView.vue";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";
import type { Data } from "./+data.server";

const data = useData<Data>();
const { messages } = useStorefrontPreferences();
</script>
