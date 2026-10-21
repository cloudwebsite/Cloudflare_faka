<template>
  <footer>
    <div class="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 text-sm text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
      <p class="whitespace-pre-wrap">{{ site.footerText }}</p>
      <div class="flex flex-col items-start gap-3 sm:items-end">
        <nav class="flex flex-wrap items-center gap-x-4 gap-y-2" :aria-label="messages.storefront.siteContentAria">
          <a href="/news" class="hover:text-foreground hover:underline">{{ messages.storefront.news }}</a>
          <a href="/help" class="hover:text-foreground hover:underline">{{ messages.storefront.help }}</a>
          <a
            v-for="page in footerPages"
            :key="page.slug"
            :href="`/page/${page.slug}`"
            class="hover:text-foreground hover:underline"
          >{{ page.title }}</a>
        </nav>
        <Button v-if="hasSupportEntry" type="button" variant="outline" size="sm" as-child>
          <a href="/support">
            <HeadphonesIcon data-icon="inline-start" />
            {{ messages.storefront.contactSupport }}
          </a>
        </Button>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { HeadphonesIcon } from "@lucide/vue";
import { usePageContext } from "vike-vue/usePageContext";

import { Button } from "@/components/ui/button";
import type { SupportChannel } from "@/lib/support-contact";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

type Site = {
  supportContact: string | null;
  supportChannels?: SupportChannel[];
  footerText: string | null;
};

type FooterPage = {
  title: string;
  slug: string;
};

const pageContext = usePageContext() as unknown as { site: Site; footerPages?: FooterPage[] };
const site = pageContext.site;
const footerPages = computed(() => pageContext.footerPages ?? []);
const { messages } = useStorefrontPreferences();
const hasSupportEntry = computed(() => (site.supportChannels?.length ?? 0) > 0);
</script>
