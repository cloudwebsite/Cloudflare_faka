<template>
  <ArticleListView
    title="新闻资讯"
    description="站点公告、活动说明与更新动态。"
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
import type { Data } from "./+data.server";

const data = useData<Data>();
</script>
