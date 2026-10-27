<template>
  <div v-if="enabled && siteKey" ref="element" class="min-h-16" :class="rootClass" />
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";

withDefaults(defineProps<{
  modelValue?: string;
  rootClass?: string;
}>(), {
  modelValue: "",
  rootClass: "",
});

const emit = defineEmits<{
  "update:modelValue": [value: string];
  loadError: [];
}>();

declare global {
  interface Window {
    turnstile?: {
      render: (element: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback"?: () => void;
      }) => string;
      reset: (widgetId?: string) => void;
      remove?: (widgetId?: string) => void;
    };
  }
}

const enabled = ref(false);
const siteKey = ref<string | null>(null);
const element = ref<HTMLElement | null>(null);
const widgetId = ref<string | null>(null);

function setToken(token: string) {
  emit("update:modelValue", token);
}

async function ensureScript() {
  if (window.turnstile) return;
  await new Promise<void>((resolve, reject) => {
    const existing = window.document.querySelector<HTMLScriptElement>('script[data-turnstile-api="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("TURNSTILE_LOAD_FAILED")), { once: true });
      if (window.turnstile) resolve();
      return;
    }
    const script = window.document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.dataset.turnstileApi = "1";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("TURNSTILE_LOAD_FAILED"));
    window.document.head.appendChild(script);
  });
}

async function mountWidget() {
  const config = await fetch("/api/security/turnstile").then((response) => response.json() as Promise<{ enabled: boolean; siteKey: string | null }>);
  if (!config.enabled || !config.siteKey) {
    enabled.value = false;
    siteKey.value = null;
    setToken("");
    return;
  }
  enabled.value = true;
  siteKey.value = config.siteKey;
  await ensureScript();
  await nextTick();
  if (!element.value || !window.turnstile) return;
  if (widgetId.value) {
    window.turnstile.remove?.(widgetId.value);
    widgetId.value = null;
  }
  widgetId.value = window.turnstile.render(element.value, {
    sitekey: config.siteKey,
    callback: (token) => setToken(token),
    "expired-callback": () => setToken(""),
    "error-callback": () => setToken(""),
  });
}

function reset() {
  setToken("");
  if (widgetId.value) window.turnstile?.reset(widgetId.value);
}

defineExpose({ reset, enabled, siteKey });

onMounted(() => {
  void mountWidget().catch(() => {
    enabled.value = false;
    siteKey.value = null;
    setToken("");
    emit("loadError");
  });
});

onBeforeUnmount(() => {
  if (widgetId.value) window.turnstile?.remove?.(widgetId.value);
});
</script>
