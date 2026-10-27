<template>
  <section class="flex w-full flex-col gap-6">
    <AdminPageHeader>
      <template #actions>
        <div class="flex items-center gap-2">
          <Button variant="outline" :disabled="saving" @click="goBack">返回列表</Button>
          <Button type="submit" form="article-editor-form" :disabled="saving || loading">
            {{ saving ? "保存中..." : loading ? "加载中..." : editing ? "保存" : "创建" }}
          </Button>
        </div>
      </template>
    </AdminPageHeader>

    <Alert v-if="loadError" variant="destructive">
      <AlertTitle>读取失败</AlertTitle>
      <AlertDescription>{{ loadError }}</AlertDescription>
    </Alert>

    <form id="article-editor-form" class="border-t" novalidate @submit.prevent="submit">
      <div class="grid gap-8 px-6 py-6 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,1fr)]">
        <FieldGroup class="gap-6">
          <FieldSet class="gap-4">
            <FieldLegend><span class="text-destructive">*</span> 标题</FieldLegend>
            <VeeField v-slot="{ componentField, errors }" name="title">
              <Field :data-invalid="errors.length > 0">
                <Input v-bind="componentField" :placeholder="titlePlaceholder" :aria-invalid="errors.length > 0" />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </FieldSet>
          <FieldSeparator />
          <FieldSet class="gap-4">
            <FieldLegend><span class="text-destructive">*</span> 正文</FieldLegend>
            <VeeField v-slot="{ errors }" name="bodyHtml">
              <Field :data-invalid="errors.length > 0">
                <ProductRichTextEditor :model-value="values.bodyHtml" @update:model-value="setFieldValue('bodyHtml', $event)" />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </FieldSet>
        </FieldGroup>

        <aside class="lg:border-l lg:pl-8">
          <FieldGroup class="gap-6">
            <FieldSet class="gap-4">
              <FieldLegend>路径与摘要</FieldLegend>
              <VeeField v-slot="{ componentField, errors }" name="slug">
                <Field :data-invalid="errors.length > 0">
                  <FieldLabel>Slug</FieldLabel>
                  <Input v-bind="componentField" placeholder="留空则根据标题生成" @update:model-value="onSlug" />
                  <FieldDescription>前台路径：{{ publicPathPrefix }}/{{ values.slug || "slug" }}</FieldDescription>
                  <FieldError v-if="errors.length" :errors="errors" />
                </Field>
              </VeeField>
              <VeeField v-slot="{ componentField }" name="summary">
                <Field>
                  <FieldLabel>摘要</FieldLabel>
                  <Textarea v-bind="componentField" rows="3" placeholder="列表与 SEO 描述，选填" />
                </Field>
              </VeeField>
            </FieldSet>
            <FieldSeparator />
            <FieldSet class="gap-4">
              <FieldLegend>封面</FieldLegend>
              <VeeField v-slot="{ componentField }" name="coverImage">
                <Field>
                  <FieldLabel>封面 URL</FieldLabel>
                  <div class="grid gap-2">
                    <Input v-bind="componentField" placeholder="/media/proxy/... 或 https://..." />
                    <Button type="button" variant="outline" @click="mediaPickerOpen = true">从媒体库选择</Button>
                  </div>
                  <img v-if="values.coverImage" :src="values.coverImage" alt="" class="mt-2 aspect-video w-full rounded-md border object-cover" />
                </Field>
              </VeeField>
            </FieldSet>
            <FieldSeparator />
            <FieldSet class="gap-4">
              <FieldLegend>展示与发布</FieldLegend>
              <VeeField v-slot="{ componentField }" name="sort">
                <Field>
                  <FieldLabel>排序</FieldLabel>
                  <Input v-bind="componentField" type="number" min="0" />
                  <FieldDescription>数字越小越靠前；置顶内容优先于排序。</FieldDescription>
                </Field>
              </VeeField>
              <Field>
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <FieldLabel>置顶</FieldLabel>
                    <FieldDescription>长期展示的重要内容可开启置顶。</FieldDescription>
                  </div>
                  <Switch :model-value="values.pinned" @update:model-value="setFieldValue('pinned', $event)" />
                </div>
              </Field>
              <VeeField name="status">
                <Field>
                  <FieldLabel>状态</FieldLabel>
                  <Select :model-value="values.status" @update:model-value="setFieldValue('status', $event)">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">草稿</SelectItem>
                      <SelectItem value="PUBLISHED">已发布</SelectItem>
                      <SelectItem value="ARCHIVED">已下架</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </VeeField>
              <VeeField v-slot="{ componentField }" name="publishedAtLocal">
                <Field>
                  <FieldLabel>发布时间</FieldLabel>
                  <Input v-bind="componentField" type="datetime-local" />
                  <FieldDescription>留空则在首次发布时自动写入当前时间。</FieldDescription>
                </Field>
              </VeeField>
            </FieldSet>
          </FieldGroup>
        </aside>
      </div>
      <div class="flex items-center justify-end gap-2 border-t px-6 py-4">
        <Button type="button" variant="outline" :disabled="saving || loading" @click="goBack">取消</Button>
        <Button type="submit" :disabled="saving || loading">{{ saving ? "保存中..." : editing ? "保存" : "创建" }}</Button>
      </div>
    </form>

    <MediaPickerDialog v-model:open="mediaPickerOpen" @select="setFieldValue('coverImage', $event)" />
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from "vue";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";
import { toTypedSchema } from "@vee-validate/zod";
import { Field as VeeField, useForm } from "vee-validate";
import { z } from "zod";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import MediaPickerDialog from "@/components/admin/MediaPickerDialog.vue";
import ProductRichTextEditor from "@/pages/@adminPath/catalog/products/ProductRichTextEditor.vue";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSeparator, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slugify";
import { runTelefunc, userErrorMessage } from "@/lib/telefunc-client";
import { onGetArticle, onSaveArticle, type ArticleType } from "@/server/content/admin.telefunc";

const props = defineProps<{
  type: ArticleType;
  baseSegment: "news" | "help" | "pages";
  articleId?: number;
  titlePlaceholder?: string;
}>();

const formSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空").max(200, "标题不能超过 200 个字符"),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$|^$/, "Slug 只能包含小写英文、数字和连字符"),
  summary: z.string().max(500, "摘要不能超过 500 个字符"),
  coverImage: z.string(),
  bodyHtml: z.string(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  pinned: z.boolean(),
  sort: z.coerce.number().int().min(0),
  publishedAtLocal: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const pageContext = usePageContext();
const listPath = computed(() => `/${pageContext.routeParams.adminPath}/content/${props.baseSegment}`);
const publicPathPrefix = computed(() => (props.baseSegment === "pages" ? "/page" : `/${props.baseSegment}`));
const editing = computed(() => Boolean(props.articleId));
const titlePlaceholder = computed(() => props.titlePlaceholder || "请输入标题");

const saving = ref(false);
const loading = ref(false);
const loadError = ref<string | null>(null);
const mediaPickerOpen = ref(false);
const slugTouched = ref(Boolean(props.articleId));

const { values, handleSubmit, resetForm, setFieldValue } = useForm<FormValues>({
  validationSchema: toTypedSchema(formSchema),
  initialValues: {
    title: "",
    slug: "",
    summary: "",
    coverImage: "",
    bodyHtml: "",
    status: "DRAFT",
    pinned: false,
    sort: 0,
    publishedAtLocal: "",
  },
  keepValuesOnUnmount: true,
});

watch(() => values.title, (title) => {
  if (!slugTouched.value && !props.articleId) setFieldValue("slug", slugify(title));
});

function onSlug() { slugTouched.value = true; }
function goBack() { void navigate(listPath.value); }

function toLocalInput(ms: number | null) {
  if (!ms) return "";
  const date = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

onMounted(async () => {
  if (!props.articleId) return;
  loading.value = true;
  loadError.value = null;
  try {
    const article = await runTelefunc(() => onGetArticle({ id: props.articleId! }), { notifyError: false });
    if (article.type !== props.type) {
      loadError.value = "内容类型不匹配。";
      return;
    }
    resetForm({
      values: {
        title: article.title,
        slug: article.slug,
        summary: article.summary ?? "",
        coverImage: article.coverImage ?? "",
        bodyHtml: article.bodyHtml,
        status: article.status,
        pinned: article.pinned,
        sort: article.sort,
        publishedAtLocal: toLocalInput(article.publishedAt),
      },
    });
    slugTouched.value = true;
  } catch (cause) {
    loadError.value = userErrorMessage(cause);
  } finally {
    loading.value = false;
  }
});

const submit = handleSubmit(async (form) => {
  saving.value = true;
  try {
    const publishedAt = form.publishedAtLocal ? new Date(form.publishedAtLocal).getTime() : null;
    const saved = await runTelefunc(() => onSaveArticle({
      id: props.articleId,
      type: props.type,
      title: form.title,
      slug: form.slug || undefined,
      summary: form.summary,
      coverImage: form.coverImage,
      bodyHtml: form.bodyHtml,
      status: form.status,
      pinned: form.pinned,
      sort: form.sort,
      publishedAt,
    }));
    if (!props.articleId) {
      await navigate(`${listPath.value}/${saved.id}`);
      return;
    }
  } catch { /* toast */ } finally {
    saving.value = false;
  }
});
</script>
