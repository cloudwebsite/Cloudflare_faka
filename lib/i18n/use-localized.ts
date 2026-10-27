import { computed } from "vue";

import { useStorefrontPreferences } from "@/lib/storefront-preferences";
import {
  pickLocalizedOptionalText,
  pickLocalizedText,
  type LocalizedNullableText,
  type LocalizedText,
} from "@/lib/i18n/localized-text";

/** Picks storefront content for the active interface locale. */
export function useLocalizedContent() {
  const { locale } = useStorefrontPreferences();
  const text = (value: LocalizedText | LocalizedNullableText) => pickLocalizedText(value, locale.value);
  const optional = (value: LocalizedNullableText | null | undefined) =>
    value ? pickLocalizedOptionalText(value, locale.value) : null;
  return {
    locale,
    text,
    optional,
    localized: computed(() => ({
      text: (value: LocalizedText | LocalizedNullableText) => pickLocalizedText(value, locale.value),
      optional: (value: LocalizedNullableText | null | undefined) =>
        value ? pickLocalizedOptionalText(value, locale.value) : null,
    })),
  };
}
