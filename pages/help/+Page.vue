<template>
  <ArticleListView
    title="帮助中心"
    description="购买、支付、查单与发货常见问题。"
    path-prefix="/help"
    :items="data.items"
    :page="data.page"
    :page-size="data.pageSize"
    :total="data.total"
  />
</template>
<script lang="ts" setup>
import { useData } from "vike-vue/useData";
import ArticleListView from "@/components/storefront/ArticleListView.vue";
import type { Data } from "./+data.server";

const data = useData<Data>();
</script>
