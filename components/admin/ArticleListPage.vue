<template>
  <section class="flex w-full flex-col gap-6">
    <AdminPageHeader />

    <Alert v-if="loadError" variant="destructive">
      <AlertTitle>读取失败</AlertTitle>
      <AlertDescription>{{ loadError }}</AlertDescription>
    </Alert>

    <AdminDataTable :columns="columns" :rows="paginatedRows" row-key="id">
      <template #toolbar>
        <div class="flex flex-wrap items-center gap-2">
          <Select v-model="draftStatusFilter">
            <SelectTrigger size="sm" class="w-28 shrink-0" aria-label="按状态筛选"><SelectValue placeholder="全部状态" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">全部状态</SelectItem>
              <SelectItem value="DRAFT">草稿</SelectItem>
              <SelectItem value="PUBLISHED">已发布</SelectItem>
              <SelectItem value="ARCHIVED">已下架</SelectItem>
            </SelectContent>
          </Select>
          <Input v-model="draftKeyword" class="h-8 w-48" placeholder="搜索标题" @keyup.enter="search" />
          <Button size="sm" @click="search">查询</Button>
          <Button variant="outline" size="sm" @click="resetFilters">重置</Button>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="loading" @click="load">
            <RefreshCwIcon :class="loading ? 'animate-spin' : ''" />刷新
          </Button>
          <Button size="sm" @click="openCreate"><PlusIcon />{{ createLabel }}</Button>
        </div>
      </template>
      <template #cell-title="{ row }">
        <div class="flex max-w-64 items-center gap-2">
          <Badge v-if="row.pinned" variant="secondary">置顶</Badge>
          <span class="truncate">{{ row.title }}</span>
        </div>
      </template>
      <template #cell-slug="{ value }"><span class="font-mono text-xs text-muted-foreground">{{ value }}</span></template>
      <template #cell-status="{ row }">
        <Badge :variant="row.status === 'PUBLISHED' ? 'default' : 'secondary'">{{ statusLabel(row.status) }}</Badge>
      </template>
      <template #actions="{ row }">
        <Button variant="ghost" size="sm" @click="openEdit(row.id)">编辑</Button>
        <Button variant="ghost" size="sm" @click="togglePin(row)">{{ row.pinned ? "取消置顶" : "置顶" }}</Button>
        <Button variant="ghost" size="sm" @click="cycleStatus(row)">{{ statusAction(row.status) }}</Button>
        <Button variant="ghost" size="sm" class="text-destructive" @click="remove(row)">删除</Button>
      </template>
      <template #pagination>
        <Pagination :total="filteredRows.length" :page="currentPage" :page-size="pageSize" @update:page="currentPage = $event" @update:page-size="pageSize = $event" />
      </template>
    </AdminDataTable>
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";
import { PlusIcon, RefreshCwIcon } from "@lucide/vue";
import AdminDataTable, { type AdminTableColumn } from "@/components/admin/AdminDataTable.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/ui/pagination/Pagination.vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { runTelefunc, userErrorMessage } from "@/lib/telefunc-client";
import {
  onDeleteArticle,
  onListArticles,
  onSetArticlePinned,
  onSetArticleStatus,
  type ArticleStatus,
  type ArticleType,
} from "@/server/content/admin.telefunc";

const props = defineProps<{
  type: ArticleType;
  baseSegment: "news" | "help" | "pages";
  createLabel: string;
}>();

type Article = Awaited<ReturnType<typeof onListArticles>>[number];

const columns: AdminTableColumn<Article>[] = [
  { key: "id", label: "ID", class: "w-16 font-mono text-xs text-muted-foreground", headerClass: "w-16" },
  { key: "title", label: "标题" },
  { key: "slug", label: "Slug", class: "w-40", headerClass: "w-40" },
  { key: "sort", label: "排序", class: "w-20", headerClass: "w-20" },
  { key: "status", label: "状态", class: "w-24", headerClass: "w-24" },
];

const pageContext = usePageContext();
const basePath = computed(() => `/${pageContext.routeParams.adminPath}/content/${props.baseSegment}`);

const rows = ref<Article[]>([]);
const draftStatusFilter = ref<"ALL" | ArticleStatus>("ALL");
const statusFilter = ref<"ALL" | ArticleStatus>("ALL");
const draftKeyword = ref("");
const keyword = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const loadError = ref<string | null>(null);

const filteredRows = computed(() => rows.value.filter((item) => {
  if (statusFilter.value !== "ALL" && item.status !== statusFilter.value) return false;
  const q = keyword.value.trim().toLowerCase();
  if (q && !item.title.toLowerCase().includes(q) && !item.slug.toLowerCase().includes(q)) return false;
  return true;
}));
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)));
const paginatedRows = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredRows.value.slice(start, start + pageSize.value);
});

onMounted(load);
watch(pageSize, () => { currentPage.value = 1; });
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages; });

function search() {
  statusFilter.value = draftStatusFilter.value;
  keyword.value = draftKeyword.value;
  currentPage.value = 1;
}
function resetFilters() {
  draftStatusFilter.value = "ALL";
  draftKeyword.value = "";
  search();
}

function statusLabel(status: ArticleStatus) {
  return { DRAFT: "草稿", PUBLISHED: "已发布", ARCHIVED: "已下架" }[status];
}
function statusAction(status: ArticleStatus) {
  return { DRAFT: "发布", PUBLISHED: "下架", ARCHIVED: "重新发布" }[status];
}

async function load() {
  loading.value = true;
  loadError.value = null;
  try {
    rows.value = await runTelefunc(() => onListArticles({ type: props.type }), { notifyError: false });
  } catch (cause) {
    loadError.value = userErrorMessage(cause);
  } finally {
    loading.value = false;
  }
}

function openCreate() { void navigate(`${basePath.value}/new`); }
function openEdit(id: number) { void navigate(`${basePath.value}/${id}`); }

async function togglePin(row: Article) {
  try {
    await runTelefunc(() => onSetArticlePinned({ id: row.id, pinned: !row.pinned }));
    await load();
  } catch { /* toast */ }
}

async function cycleStatus(row: Article) {
  const next: ArticleStatus = row.status === "PUBLISHED" ? "ARCHIVED" : "PUBLISHED";
  try {
    await runTelefunc(() => onSetArticleStatus({ id: row.id, status: next }));
    await load();
  } catch { /* toast */ }
}

async function remove(row: Article) {
  if (!window.confirm(`确定删除「${row.title}」？`)) return;
  try {
    await runTelefunc(() => onDeleteArticle({ id: row.id }));
    await load();
  } catch { /* toast */ }
}
</script>
