<template>
  <component :is="AuthShell">
    <Card class="w-full max-w-md">
      <CardHeader>
        <CardTitle>{{ messages.auth.twoFactor.title }}</CardTitle>
        <CardDescription>{{ messages.auth.twoFactor.description }}</CardDescription>
      </CardHeader>
      <form novalidate @submit.prevent="verify">
        <CardContent>
          <FieldGroup>
            <VeeField v-slot="{ componentField, errors }" name="code" :validate-on-input="true">
              <Field :data-invalid="errors.length > 0">
                <FieldLabel for="totp-code">{{ messages.auth.twoFactor.code }}</FieldLabel>
                <Input
                  id="totp-code"
                  v-bind="componentField"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  :placeholder="messages.auth.twoFactor.placeholder"
                  :aria-invalid="errors.length > 0"
                  @input="normalizeCode"
                />
                <FieldError v-if="errors.length" :errors="errors" />
              </Field>
            </VeeField>
          </FieldGroup>
        </CardContent>
        <CardFooter class="mt-6">
          <Button class="w-full" type="submit" :disabled="isSubmitting">{{ isSubmitting ? messages.auth.twoFactor.verifying : messages.auth.twoFactor.continue }}</Button>
        </CardFooter>
      </form>
    </Card>
  </component>
</template>

<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { Field as VeeField, useForm } from "vee-validate";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-vue/usePageContext";
import { toast } from "vue-sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { resolveStorefrontView } from "@/lib/storefront-templates/resolve";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";

const pageContext = usePageContext() as { site?: { layout?: string } };
const AuthShell = resolveStorefrontView("AuthShell", pageContext.site?.layout);
const { messages } = useStorefrontPreferences();

const { handleSubmit, isSubmitting, setFieldValue } = useForm({
  validationSchema: toTypedSchema(z.object({
    code: z.string().regex(/^\d{6}$/, messages.value.auth.twoFactor.codeInvalid),
  })),
  initialValues: { code: "" },
});

function normalizeCode(event: Event) {
  const input = event.target as HTMLInputElement;
  const code = input.value.replace(/\D/g, "").slice(0, 6);
  input.value = code;
  setFieldValue("code", code);
}

const verify = handleSubmit(async ({ code }) => {
  try {
    const result = await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
    if (result.error) {
      toast.error(messages.value.auth.twoFactor.codeExpired);
      return;
    }
    await navigate("/auth/continue");
  } catch {
    toast.error(messages.value.auth.twoFactor.failed);
  }
});
</script>
