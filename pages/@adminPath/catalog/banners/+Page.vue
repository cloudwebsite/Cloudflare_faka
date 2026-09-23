<template>
  <section class="flex w-full flex-col gap-6">
    <AdminPageHeader />

    <Alert v-if="loadError" variant="destructive">
      <AlertTitle>读取轮播失败</AlertTitle>
      <AlertDescription>{{ loadError }}</AlertDescription>
    </Alert>

    <AdminDataTable :columns="columns" :rows="paginatedBanners" row-key="id">
      <template #toolbar>
        <div class="flex flex-wrap items-center gap-2">
          <Select v-model="draftStatusFilter">
            <SelectTrigger size="sm" class="w-28 shrink-0" aria-label="按状态筛选"><SelectValue placeholder="全部状态" /></SelectTrigger>
            <SelectContent><SelectItem value="ALL">全部状态</SelectItem><SelectItem value="ACTIVE">启用</SelectItem><SelectItem value="DISABLED">停用</SelectItem></SelectContent>
          </Select>
          <Button size="sm" @click="search">查询</Button>
          <Button variant="outline" size="sm" @click="resetFilters">重置</Button>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="loading" aria-label="刷新" title="刷新" @click="loadBanners">
            <RefreshCwIcon :class="loading ? 'animate-spin' : ''" />刷新
          </Button>
          <Button size="sm" @click="openCreate"><PlusIcon />添加轮播</Button>
        </div>
      </template>
      <template #cell-imageUrl="{ row }">
        <img v-if="row.imageUrl" :src="row.imageUrl" :alt="row.title || '轮播图'" class="h-10 w-20 rounded border object-cover" />
        <span v-else class="text-muted-foreground">-</span>
      </template>
      <template #cell-title="{ value }"><span class="block max-w-48 truncate">{{ value || "-" }}</span></template>
      <template #cell-linkUrl="{ value }"><span class="block max-w-56 truncate font-mono text-xs text-muted-foreground">{{ value || "-" }}</span></template>
      <template #cell-status="{ row }"><Badge :variant="row.status === 'ACTIVE' ? 'default' : 'secondary'">{{ row.status === "ACTIVE" ? "启用" : "停用" }}</Badge></template>
      <template #actions="{ row }">
        <Button variant="ghost" size="sm" @click="openEdit(row)">编辑</Button>
        <Button variant="ghost" size="sm" @click="setStatus(row)">{{ row.status === "ACTIVE" ? "停用" : "启用" }}</Button>
        <Button variant="ghost" size="sm" class="text-destructive" @click="removeBanner(row)">删除</Button>
      </template>
      <template #pagination>
        <Pagination :total="filteredBanners.length" :page="currentPage" :page-size="pageSize" @update:page="currentPage = $event" @update:page-size="pageSize = $event" />
      </template>
    </AdminDataTable>

    <Dialog v-model:open="dialogOpen">
      <DialogContent>
        <DialogHeader class="pr-8">
          <DialogTitle>{{ form.id ? "编辑轮播" : "添加轮播" }}</DialogTitle>
          <DialogDescription>启用的轮播会按排序出现在支持 Banner 的前台模板首页。</DialogDescription>
        </DialogHeader>
        <form class="grid gap-4" @submit.prevent="saveBanner">
          <div class="grid gap-2">
            <Label for="banner-title">标题</Label>
            <Input id="banner-title" v-model="form.title" maxlength="120" placeholder="可选，用于无障碍与管理识别" />
          </div>
          <div class="grid gap-2">
            <Label for="banner-image"><span class="text-destructive">*</span> 图片地址</Label>
            <div class="flex gap-2">
              <Input id="banner-image" v-model="form.imageUrl" required placeholder="/media/proxy/... 或 https://..." />
              <Button type="button" variant="outline" @click="mediaPickerOpen = true">选择图片</Button>
            </div>
            <img v-if="form.imageUrl" :src="form.imageUrl" alt="" class="mt-1 h-24 w-full rounded border object-cover" />
          </div>
          <div class="grid gap-2">
            <Label for="banner-link">跳转链接</Label>
            <Input id="banner-link" v-model="form.linkUrl" placeholder="/product/xxx 或 https://..." />
          </div>
          <div class="grid gap-2">
            <Label for="banner-sort"><span class="text-destructive">*</span> 排序</Label>
            <Input id="banner-sort" v-model.number="form.sort" type="number" min="0" required />
          </div>
          <DialogFooter>
            <DialogClose as-child><Button type="button" variant="outline">取消</Button></DialogClose>
            <Button type="submit" :disabled="saving">{{ saving ? "保存中..." : form.id ? "保存轮播" : "创建轮播" }}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    <MediaPickerDialog :open="mediaPickerOpen" @update:open="(open) => { mediaPickerOpen = open; }" @select="(url) => { form.imageUrl = url; mediaPickerOpen = false; }" />
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import AdminDataTable, { type AdminTableColumn } from "@/components/admin/AdminDataTable.vue";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Pagination from "@/components/ui/pagination/Pagination.vue";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon, RefreshCwIcon } from "@lucide/vue";
import { runTelefunc, userErrorMessage } from "@/lib/telefunc-client";
import { onDeleteBanner, onListBanners, onSaveBanner, onSetBannerStatus } from "@/server/catalog/banner.telefunc";

type Banner = Awaited<ReturnType<typeof onListBanners>>[number];
const columns: AdminTableColumn<Banner>[] = [
  { key: "id", label: "ID", class: "w-16 font-mono text-xs text-muted-foreground", headerClass: "w-16" },
  { key: "imageUrl", label: "预览", class: "w-28", headerClass: "w-28" },
  { key: "title", label: "标题" },
  { key: "linkUrl", label: "跳转" },
  { key: "sort", label: "排序", class: "w-20", headerClass: "w-20" },
  { key: "status", label: "状态", class: "w-24", headerClass: "w-24" },
];

const banners = ref<Banner[]>([]);
const draftStatusFilter = ref<"ALL" | "ACTIVE" | "DISABLED">("ALL");
const statusFilter = ref<"ALL" | "ACTIVE" | "DISABLED">("ALL");
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const saving = ref(false);
const loadError = ref<string | null>(null);
const dialogOpen = ref(false);
const mediaPickerOpen = ref(false);
const form = reactive({ id: undefined as number | undefined, title: "", imageUrl: "", linkUrl: "", sort: 0 });

const filteredBanners = computed(() => banners.value.filter((item) => statusFilter.value === "ALL" || item.status === statusFilter.value));
const totalPages = computed(() => Math.max(1, Math.ceil(filteredBanners.value.length / pageSize.value)));
const paginatedBanners = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredBanners.value.slice(start, start + pageSize.value);
});

onMounted(loadBanners);
function search() { statusFilter.value = draftStatusFilter.value; currentPage.value = 1; }
function resetFilters() { draftStatusFilter.value = "ALL"; search(); }
watch(pageSize, () => { currentPage.value = 1; });
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages; });

async function loadBanners() {
  loading.value = true;
  loadError.value = null;
  try {
    banners.value = await runTelefunc(() => onListBanners(), { notifyError: false });
  } catch (cause) {
    loadError.value = userErrorMessage(cause);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  Object.assign(form, { id: undefined, title: "", imageUrl: "", linkUrl: "", sort: 0 });
  dialogOpen.value = true;
}

function openEdit(item: Banner) {
  Object.assign(form, { id: item.id, title: item.title ?? "", imageUrl: item.imageUrl, linkUrl: item.linkUrl ?? "", sort: item.sort });
  dialogOpen.value = true;
}

async function saveBanner() {
  saving.value = true;
  try {
    await runTelefunc(() => onSaveBanner({
      id: form.id,
      title: form.title,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      sort: form.sort,
    }));
    dialogOpen.value = false;
    await loadBanners();
  } catch { /* toast via runTelefunc */ } finally {
    saving.value = false;
  }
}

async function setStatus(item: Banner) {
  try {
    await runTelefunc(() => onSetBannerStatus({ id: item.id, status: item.status === "ACTIVE" ? "DISABLED" : "ACTIVE" }));
    await loadBanners();
  } catch { /* toast via runTelefunc */ }
}

async function removeBanner(item: Banner) {
  if (!window.confirm(`确定删除轮播「${item.title || item.id}」？`)) return;
  try {
    await runTelefunc(() => onDeleteBanner({ id: item.id }));
    await loadBanners();
  } catch { /* toast via runTelefunc */ }
}
</script>
