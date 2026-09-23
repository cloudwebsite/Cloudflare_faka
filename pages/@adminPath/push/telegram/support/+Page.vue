<template>
  <section class="flex w-full flex-col gap-6">
    <AdminPageHeader />

    <Card>
      <CardHeader>
        <CardTitle>客服机器人</CardTitle>
        <CardDescription>独立于推送通知的 Telegram 客服 Webhook。查单规则与网站一致：匿名订单需订单号+邮箱；账户订单不在机器人中展示发货内容。</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="loading" class="py-8 text-center text-sm text-muted-foreground">正在加载...</div>
        <form v-else class="grid gap-5 lg:grid-cols-2" novalidate @submit.prevent="submit">
          <VeeField v-slot="{ componentField, errors }" name="botToken">
            <Field class="lg:col-span-2" :data-invalid="errors.length > 0">
              <FieldLabel for="support-token">Bot Token</FieldLabel>
              <Input id="support-token" v-bind="componentField" type="password" autocomplete="off" placeholder="从 @BotFather 获取；已保存时可留空保持不变" :aria-invalid="errors.length > 0" />
              <FieldDescription>建议与推送通知使用不同机器人，避免 Webhook 互相覆盖。</FieldDescription>
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>
          <VeeField v-slot="{ componentField, errors }" name="webhookSecret">
            <Field :data-invalid="errors.length > 0">
              <FieldLabel for="support-secret">Webhook Secret</FieldLabel>
              <div class="flex gap-2">
                <Input id="support-secret" v-bind="componentField" autocomplete="off" :aria-invalid="errors.length > 0" />
                <Button type="button" variant="outline" @click="fillSecret">生成</Button>
              </div>
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>
          <VeeField v-slot="{ componentField, errors }" name="adminChatId">
            <Field :data-invalid="errors.length > 0">
              <FieldLabel for="support-admin-chat">人工转发 Chat ID</FieldLabel>
              <Input id="support-admin-chat" v-bind="componentField" placeholder="可空；留空时尝试使用已启用的推送 Telegram Chat ID" :aria-invalid="errors.length > 0" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>
          <VeeField v-slot="{ componentField, errors }" name="welcomeMessage">
            <Field class="lg:col-span-2" :data-invalid="errors.length > 0">
              <FieldLabel for="support-welcome">欢迎语（可选）</FieldLabel>
              <Input id="support-welcome" v-bind="componentField" maxlength="500" :aria-invalid="errors.length > 0" />
              <FieldError v-if="errors.length" :errors="errors" />
            </Field>
          </VeeField>
          <div class="flex flex-wrap items-center justify-between gap-4 lg:col-span-2">
            <Field orientation="horizontal" class="w-auto">
              <div>
                <FieldLabel for="support-enabled">启用客服机器人</FieldLabel>
                <FieldDescription>启用后需注册 Webhook；未启用时接口返回 404。</FieldDescription>
              </div>
              <Switch id="support-enabled" v-model="isEnabled" />
            </Field>
            <div class="flex flex-wrap gap-2">
              <Button type="submit" :disabled="saving">{{ saving ? "保存中..." : "保存配置" }}</Button>
              <Button type="button" variant="outline" :disabled="registering || !siteUrl || configurationError" @click="registerWebhook">{{ registering ? "注册中..." : "注册 Webhook" }}</Button>
              <Button type="button" variant="outline" :disabled="testing || configurationError" @click="testProvider">{{ testing ? "发送中..." : "发送测试消息" }}</Button>
            </div>
          </div>
          <p v-if="!siteUrl" class="text-sm text-muted-foreground lg:col-span-2">请先在站点配置中填写网站地址，才能注册 Webhook。</p>
          <p v-if="configurationError" class="text-sm text-destructive lg:col-span-2">当前配置无效，请重新填写并保存。</p>
        </form>
      </CardContent>
    </Card>
  </section>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { Field as VeeField, useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import AdminPageHeader from "@/components/admin/AdminPageHeader.vue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { runTelefunc } from "@/lib/telefunc-client";
import { toast } from "vue-sonner";
import {
  onGenerateTelegramSupportSecret,
  onGetTelegramSupport,
  onRegisterTelegramSupportWebhook,
  onSaveTelegramSupport,
  onTestTelegramSupport,
} from "@/server/telegram-support/admin.telefunc";

const schema = toTypedSchema(z.object({
  botToken: z.string().trim().refine((value) => !value || /^\d+:[A-Za-z0-9_-]+$/.test(value) || value.includes("…"), "请填写有效的 Bot Token。"),
  webhookSecret: z.string().trim().min(16, "Webhook Secret 至少 16 位。").max(256, "Webhook Secret 过长。"),
  adminChatId: z.string().trim().max(128).refine((value) => !value || /^-?\d+$/.test(value) || /^@[A-Za-z][A-Za-z0-9_]{4,}$/.test(value), "请填写数字 Chat ID 或 @channel。"),
  welcomeMessage: z.string().trim().max(500).optional(),
}));

const { handleSubmit, resetForm, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: { botToken: "", webhookSecret: "", adminChatId: "", welcomeMessage: "" },
});

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const registering = ref(false);
const isEnabled = ref(false);
const siteUrl = ref<string | null>(null);
const configurationError = ref(false);
const tokenConfigured = ref(false);

async function loadConfig() {
  loading.value = true;
  try {
    const result = await runTelefunc(() => onGetTelegramSupport());
    siteUrl.value = result.siteUrl;
    configurationError.value = result.config.configurationError;
    isEnabled.value = result.config.isEnabled;
    tokenConfigured.value = Boolean(result.config.botTokenConfigured);
    resetForm({
      values: {
        botToken: result.config.botToken || "",
        webhookSecret: result.config.webhookSecret || result.generatedSecret,
        adminChatId: result.config.adminChatId || "",
        welcomeMessage: result.config.welcomeMessage || "",
      },
    });
  } finally {
    loading.value = false;
  }
}

async function fillSecret() {
  const result = await runTelefunc(() => onGenerateTelegramSupportSecret());
  setFieldValue("webhookSecret", result.secret);
}

const submit = handleSubmit(async (values) => {
  saving.value = true;
  try {
    const botToken = values.botToken.includes("…") ? "" : values.botToken.trim();
    if (!botToken && !tokenConfigured.value) {
      toast.error("请填写 Bot Token。");
      return;
    }
    await runTelefunc(() => onSaveTelegramSupport({
      isEnabled: isEnabled.value,
      botToken,
      webhookSecret: values.webhookSecret,
      adminChatId: values.adminChatId,
      welcomeMessage: values.welcomeMessage,
    }), { successMessage: "客服机器人配置已保存。" });
    await loadConfig();
  } catch {
    /* runTelefunc owns feedback */
  } finally {
    saving.value = false;
  }
});

async function registerWebhook() {
  registering.value = true;
  try {
    const result = await runTelefunc(() => onRegisterTelegramSupportWebhook(), { successMessage: "Webhook 已注册。" });
    if (result?.url) {
      /* success toast already shown */
    }
  } catch {
    /* owned */
  } finally {
    registering.value = false;
  }
}

async function testProvider() {
  testing.value = true;
  try {
    await runTelefunc(() => onTestTelegramSupport(), { successMessage: "测试消息已发送。" });
  } catch {
    /* owned */
  } finally {
    testing.value = false;
  }
}

onMounted(loadConfig);
</script>
