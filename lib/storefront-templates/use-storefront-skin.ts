import { computed, onMounted, watch } from "vue";
import { usePageContext } from "vike-vue/usePageContext";
import { normalizeStorefrontSkin } from "@/lib/storefront-templates/registry";

export function useStorefrontSkin() {
  const pageContext = usePageContext() as { site?: { skin?: string } };
  const skin = computed(() => normalizeStorefrontSkin(pageContext.site?.skin));

  function apply() {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.storefrontSkin = skin.value;
  }

  onMounted(apply);
  watch(skin, apply, { immediate: true });

  return { skin };
}
