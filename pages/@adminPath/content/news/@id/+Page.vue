<template>
  <ArticleEditorPage type="NEWS" base-segment="news" :article-id="articleId" />
</template>
<script lang="ts" setup>
import { computed } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import ArticleEditorPage from "@/components/admin/ArticleEditorPage.vue";

const pageContext = usePageContext();
const articleId = computed(() => Number(pageContext.routeParams.id));
</script>
