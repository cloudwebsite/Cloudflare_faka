<template>
  <StorefrontPageChrome>
    <div class="mb-8">
      <h1 class="text-2xl font-semibold tracking-tight">{{ messages.storefront.supportPageTitle }}</h1>
      <p class="mt-2 text-sm text-muted-foreground">{{ messages.storefront.supportPageSubtitle }}</p>
    </div>

    <div v-if="!channels.length" class="rounded-xl border border-dashed bg-card px-6 py-16 text-center text-sm text-muted-foreground">
      {{ messages.storefront.supportEmpty }}
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2">
      <article
        v-for="(channel, index) in channels"
        :key="`${channel.type}-${index}`"
        class="flex flex-col overflow-hidden rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-foreground/15"
      >
        <div class="flex flex-1 gap-4">
          <div class="min-w-0 flex-1 space-y-3">
            <div class="flex items-center gap-2.5">
              <span class="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <component :is="channelIcon(channel)" class="size-4" />
              </span>
              <h2 class="text-base font-semibold tracking-tight">{{ channelTitle(channel) }}</h2>
            </div>

            <div v-if="channelAccount(channel)" class="flex flex-wrap items-center gap-1.5">
              <span class="break-all font-mono text-sm text-foreground">{{ channelAccount(channel) }}</span>
              <Button type="button" variant="ghost" size="sm" class="h-8 gap-1 px-2 text-muted-foreground" @click="copyText(channelAccount(channel)!)">
                <CopyIcon class="size-3.5" />
                <span class="text-xs">{{ messages.storefront.supportCopy }}</span>
              </Button>
            </div>

            <p class="text-xs leading-5 text-muted-foreground">{{ channelHint(channel) }}</p>
          </div>

          <img
            v-if="channel.type === 'wechat' && channel.qrUrl"
            :src="channel.qrUrl"
            alt="WeChat QR"
            class="size-28 shrink-0 self-start rounded-xl border bg-background object-cover shadow-sm"
          />
        </div>

        <div class="mt-5 border-t pt-4">
          <Button type="button" class="w-full" as-child>
            <a
              :href="channel.href"
              :target="channel.type === 'wechat' ? undefined : '_blank'"
              rel="noopener noreferrer"
            >
              {{ channelAction(channel) }}
            </a>
          </Button>
        </div>
      </article>
    </div>

    <div class="mt-8 flex justify-start">
      <Button type="button" variant="outline" as-child>
        <a href="/">{{ messages.storefront.supportBackHome }}</a>
      </Button>
    </div>
  </StorefrontPageChrome>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { CopyIcon, HeadphonesIcon, MailIcon, MessageCircleIcon, SendIcon } from "@lucide/vue";
import { usePageContext } from "vike-vue/usePageContext";
import { toast } from "vue-sonner";

import StorefrontPageChrome from "@/components/storefront/StorefrontPageChrome.vue";
import { Button } from "@/components/ui/button";
import type { SupportChannel } from "@/lib/support-contact";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

type Site = {
  supportChannels?: SupportChannel[];
};

const pageContext = usePageContext() as unknown as { site: Site };
const { messages } = useStorefrontPreferences();
const channels = computed(() => pageContext.site.supportChannels ?? []);

function channelIcon(channel: SupportChannel) {
  if (channel.type === "qq" || channel.type === "wechat") return MessageCircleIcon;
  if (channel.type === "telegram") return SendIcon;
  if (channel.type === "email") return MailIcon;
  return HeadphonesIcon;
}

function channelTitle(channel: SupportChannel) {
  if (channel.type === "qq") return messages.value.storefront.supportQqTitle;
  if (channel.type === "telegram") return messages.value.storefront.supportTelegramTitle;
  if (channel.type === "wechat") return messages.value.storefront.supportWechatTitle;
  if (channel.type === "email") return messages.value.storefront.supportEmailTitle;
  return channel.label;
}

function channelAccount(channel: SupportChannel) {
  if (channel.type === "qq" || channel.type === "telegram") return channel.account;
  if (channel.type === "wechat") return channel.account;
  if (channel.type === "email") return channel.address;
  return channel.href;
}

function channelHint(channel: SupportChannel) {
  if (channel.type === "qq") return messages.value.storefront.supportQqHint;
  if (channel.type === "telegram") return messages.value.storefront.supportTelegramHint;
  if (channel.type === "wechat") {
    if (channel.account && channel.qrUrl) return messages.value.storefront.supportWechatHint;
    if (channel.qrUrl) return messages.value.storefront.supportWechatQrHint;
    return messages.value.storefront.supportWechatAccountHint;
  }
  if (channel.type === "email") return messages.value.storefront.supportEmailHint;
  return messages.value.storefront.supportLinkAction;
}

function channelAction(channel: SupportChannel) {
  if (channel.type === "qq") return messages.value.storefront.supportQqAction;
  if (channel.type === "telegram") return messages.value.storefront.supportTelegramAction;
  if (channel.type === "wechat") return messages.value.storefront.supportWechatAction;
  if (channel.type === "email") return messages.value.storefront.supportEmailAction;
  return messages.value.storefront.supportLinkAction;
}

async function copyText(value: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "true");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
    }
    toast.success(messages.value.storefront.supportCopied);
  } catch {
    toast.error(messages.value.storefront.supportCopyFailed);
  }
}
</script>
