<template>
  <div :class="isQuickcard ? 'grid gap-3.5' : 'flex h-full min-h-0 flex-col'">
    <div
      v-if="!slug"
      class="flex items-center justify-center rounded-lg border border-dashed border-border bg-card p-8 text-center"
      :class="isQuickcard ? '' : 'flex-1 bg-muted/20'"
    >
      <div>
        <PackageOpenIcon class="mx-auto size-8 text-muted-foreground" />
        <p class="mt-3 text-sm text-muted-foreground">{{ isQuickcard ? "请先选择上方商品" : "选择左侧商品开始下单" }}</p>
      </div>
    </div>
    <div
      v-else-if="loadingProduct"
      class="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground"
      :class="isQuickcard ? '' : 'flex flex-1 items-center justify-center'"
    >
      加载中…
    </div>
    <div
      v-else-if="!product"
      class="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground"
      :class="isQuickcard ? '' : 'flex flex-1 items-center justify-center'"
    >
      {{ loadError || "商品不存在" }}
    </div>
    <template v-else>
      <!-- 商品详情介绍（对齐快卡目标站 goods-desc-section） -->
      <section
        v-if="isQuickcard && product.description"
        class="rounded-lg border border-border bg-card p-4 shadow-sm sm:p-5"
      >
        <div class="flex items-center gap-2">
          <span class="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          <h2 class="text-sm font-semibold text-foreground">{{ messages.productCheckout.productDetails }}</h2>
        </div>
        <div class="mt-3 flex gap-4">
          <div v-if="product.coverImage" class="hidden size-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted sm:block">
            <img :src="product.coverImage" :alt="product.name" class="size-full object-cover" />
          </div>
          <div class="min-w-0 flex-1">
            <h3 class="text-base font-semibold text-foreground">{{ product.name }}</h3>
            <p v-if="product.subtitle" class="mt-1 text-sm text-muted-foreground">{{ product.subtitle }}</p>
            <!-- `description` is sanitized server-side by sanitizeProductDescription(). -->
            <!-- eslint-disable vue/no-v-html -->
            <div
              class="product-rich-content mt-3 text-sm leading-7 text-foreground [&_a]:text-primary [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-[3px] [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_h1]:mb-2 [&_h1]:mt-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mb-1.5 [&_h3]:mt-2.5 [&_h3]:text-base [&_h3]:font-semibold [&_img]:my-3 [&_img]:block [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
              v-html="product.description"
            />
            <!-- eslint-enable vue/no-v-html -->
          </div>
        </div>
      </section>

      <template v-if="!isQuickcard">
        <div class="mb-4 min-w-0">
          <Badge variant="secondary">{{ product.categoryName || messages.productCheckout.defaultCategory }}</Badge>
          <h2 class="mt-2 line-clamp-2 text-lg font-semibold tracking-normal">{{ product.name }}</h2>
          <p v-if="product.subtitle" class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ product.subtitle }}</p>
        </div>
      </template>

      <Card class="min-w-0" :class="isQuickcard ? 'rounded-lg border-border shadow-[0_7px_29px_0_rgba(18,52,91,0.08)]' : 'shadow-sm'">
        <CardHeader class="pb-3" :class="isQuickcard ? 'space-y-1' : ''">
          <div v-if="isQuickcard" class="flex items-center gap-2">
            <span class="size-1.5 rounded-full bg-primary" aria-hidden="true" />
            <CardDescription class="text-sm font-semibold text-foreground">填写订单</CardDescription>
          </div>
          <template v-else>
            <CardDescription>{{ messages.productCheckout.currentPrice }}</CardDescription>
          </template>
          <div class="flex flex-wrap items-end justify-between gap-2">
            <CardTitle class="storefront-price text-2xl">¥{{ selectedSku?.price }}</CardTitle>
            <Badge v-if="isQuickcard" variant="secondary">{{ product.categoryName || messages.productCheckout.defaultCategory }}</Badge>
          </div>
          <p v-if="isQuickcard" class="text-sm font-medium text-foreground">{{ product.name }}</p>
        </CardHeader>
        <form v-if="selectedSku" class="grid min-w-0 gap-4" novalidate @submit.prevent="submit">
          <CardContent class="grid min-w-0 gap-4 pt-0">
            <div v-if="product.skus.length > 1" class="grid gap-2 text-sm font-medium">
              <span>选择规格</span>
              <div
                class="grid gap-2"
                :class="isQuickcard ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3' : 'grid-cols-1'"
                role="group"
                aria-label="选择规格"
              >
                <Button
                  v-for="sku in product.skus"
                  :key="sku.id"
                  type="button"
                  :variant="String(sku.id) === selectedSkuId ? 'default' : 'outline'"
                  class="h-auto min-h-12 justify-start whitespace-normal px-3 py-2.5 text-left text-sm leading-5"
                  :aria-pressed="String(sku.id) === selectedSkuId"
                  @click="selectedSkuId = String(sku.id)"
                >
                  <span class="block font-medium">{{ sku.name }}</span>
                  <span class="mt-0.5 block text-xs opacity-80">¥{{ sku.price }}</span>
                </Button>
              </div>
            </div>
            <p v-if="requiresPayment && !methods.length" class="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{{ messages.productCheckout.noPaymentMethod }}</p>
            <label class="grid min-w-0 gap-2 text-sm font-medium">
              <span class="flex items-center gap-1"><span class="text-destructive">*</span> {{ messages.productCheckout.contactEmail }}</span>
              <Input v-model="contactValue" type="email" autocomplete="email" class="max-w-sm" required />
            </label>
            <label class="grid min-w-0 gap-2 text-sm font-medium">
              <span class="flex items-center gap-1"><span class="text-destructive">*</span> {{ messages.productCheckout.quantity }}</span>
              <Input v-model.number="quantity" type="number" class="max-w-[8rem]" :min="selectedSku.minBuy" :max="purchaseLimit" required />
              <span v-if="isStockLimited" class="text-xs font-normal text-muted-foreground">{{ t(messages.productCheckout.availableStock, { count: availableStock }) }}</span>
            </label>
            <FieldSet v-if="selectedSku.deliveryType === 'EXPRESS'" class="min-w-0 gap-3">
              <FieldLegend>{{ messages.productCheckout.shippingAddress }}</FieldLegend>
              <Field v-if="addresses.length" class="min-w-0">
                <FieldLabel for="panel-checkout-address">{{ messages.productCheckout.selectSavedAddress }}</FieldLabel>
                <Select :model-value="selectedAddress" class="block w-full min-w-0 max-w-lg" @update:model-value="onAddressSelectionChange">
                  <SelectTrigger id="panel-checkout-address" class="w-full! min-w-0 max-w-full">
                    <SelectValue :placeholder="messages.productCheckout.selectShippingAddress" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="item in addresses" :key="String(item.id)" :value="String(item.id)">{{ item.recipientName }} · {{ item.phone }}</SelectItem>
                    <SelectItem value="new">{{ messages.productCheckout.enterNewAddress }}</SelectItem>
                    <SelectItem v-if="!user" value="clear-local-addresses" class="text-destructive focus:text-destructive">{{ messages.productCheckout.clearBrowserAddresses }}</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <p v-else-if="addressesLoading" class="text-sm text-muted-foreground">{{ messages.productCheckout.loadingSavedAddresses }}</p>
              <div v-if="selectedAddress === 'new' || !addresses.length" class="grid gap-3" :class="isQuickcard ? 'sm:grid-cols-2 max-w-2xl' : ''">
                <VeeField v-for="field in addressFieldsWithoutPostalCode" :key="field.name" v-slot="{ componentField, errors }" :name="field.name" :validate-on-input="true">
                  <Field :class="isQuickcard && 'wide' in field && field.wide ? 'sm:col-span-2' : ''" :data-invalid="errors.length > 0">
                    <FieldLabel :for="`panel-${field.name}`"><span v-if="field.required" class="text-destructive">*</span> {{ field.label }}</FieldLabel>
                    <Input :id="`panel-${field.name}`" v-bind="componentField" :autocomplete="field.autocomplete" :aria-invalid="errors.length > 0" />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <VeeField v-slot="{ componentField, errors }" name="postalCode" :validate-on-input="true">
                  <Field :data-invalid="errors.length > 0">
                    <FieldLabel for="panel-postalCode">{{ messages.productCheckout.address.postalCode }}</FieldLabel>
                    <Input id="panel-postalCode" v-bind="componentField" autocomplete="postal-code" :aria-invalid="errors.length > 0" />
                    <FieldError v-if="errors.length" :errors="errors" />
                  </Field>
                </VeeField>
                <Button type="button" variant="outline" class="w-full" :class="isQuickcard ? 'sm:col-span-2 max-w-xs' : ''" :disabled="savingAddress" @click="saveCurrentAddress">{{ savingAddress ? messages.productCheckout.savingAddress : messages.productCheckout.saveAddress }}</Button>
              </div>
            </FieldSet>
            <div v-if="methods.length" class="grid gap-2 text-sm font-medium">
              <span>{{ messages.productCheckout.paymentMethod }}</span>
              <div class="grid gap-2" :class="isQuickcard ? 'grid-cols-1 sm:grid-cols-2 max-w-xl' : 'grid-cols-1'" role="group" :aria-label="messages.productCheckout.paymentMethod">
                <button
                  v-for="item in methods"
                  :key="item.key"
                  type="button"
                  class="group relative flex cursor-pointer select-none items-center gap-3.5 rounded-xl border px-3.5 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  :class="[
                    selectedMethod === item.key
                      ? 'border-primary bg-primary/5 text-foreground shadow-xs ring-2 ring-primary/40 dark:bg-primary/10'
                      : 'border-border/70 bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/30 hover:text-foreground',
                  ]"
                  :aria-pressed="selectedMethod === item.key"
                  @click="selectedMethod = item.key"
                >
                  <PaymentMethodIcon
                    :provider="item.provider"
                    :channel="item.channel"
                    :name="item.name"
                    class="size-8 rounded-lg shadow-xs transition-transform duration-200 group-hover:scale-105"
                  />
                  <span class="text-sm font-semibold tracking-tight text-foreground">{{ formatPaymentName(item) }}</span>
                </button>
              </div>
            </div>
            <div class="grid gap-2 text-sm font-medium">
              <span>{{ messages.productCheckout.discountCode }}</span>
              <div class="flex max-w-md gap-2">
                <Input v-model="discountCode" autocomplete="off" @keydown.enter.prevent="onApplyDiscount" />
                <Button type="button" variant="outline" :disabled="discountApplying || !discountCode.trim()" @click="onApplyDiscount">{{ discountApplying ? messages.productCheckout.applyingDiscount : messages.productCheckout.applyDiscount }}</Button>
              </div>
            </div>
            <div v-if="discountPreview" class="grid max-w-md gap-1 rounded-md border bg-muted/30 p-3 text-sm">
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">{{ messages.productCheckout.originalAmount }}</span><span>¥{{ discountPreview.originalAmount }}</span></div>
              <div class="flex justify-between gap-4"><span class="text-muted-foreground">{{ t(messages.productCheckout.appliedDiscount, { code: discountPreview.code }) }}</span><span class="text-destructive">-¥{{ discountPreview.discountAmount }}</span></div>
              <div class="flex justify-between gap-4 border-t pt-2 font-medium"><span>{{ messages.productCheckout.amountDue }}</span><span>¥{{ discountPreview.finalAmount }}</span></div>
            </div>
            <label class="grid max-w-xl gap-2 text-sm font-medium">{{ messages.productCheckout.buyerNote }}<Textarea v-model="buyerNote" rows="2" /></label>
          </CardContent>
          <CardFooter class="flex-col items-stretch gap-2 pt-0" :class="isQuickcard ? 'max-w-md' : ''">
            <Button type="submit" size="lg" :disabled="submitting || isOutOfStock || (requiresPayment && !methods.length)">
              {{ submitting ? messages.productCheckout.processingOrder : isOutOfStock ? messages.storefront.outOfStock : requiresPayment ? messages.productCheckout.submitAndPay : messages.productCheckout.createFreeOrder }}
            </Button>
            <p class="text-xs text-muted-foreground">{{ messages.productCheckout.paymentAmountNotice }}</p>
          </CardFooter>
        </form>
      </Card>
    </template>

    <Dialog :open="clearAddressesDialogOpen" @update:open="(open) => { clearAddressesDialogOpen = open; if (!open) selectedAddress = previousAddressSelection; }">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ messages.productCheckout.confirmClearAddressesTitle }}</DialogTitle>
          <DialogDescription>{{ messages.productCheckout.confirmClearAddressesDescription }}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" @click="clearAddressesDialogOpen = false">{{ messages.productCheckout.cancel }}</Button>
          <Button type="button" variant="destructive" @click="confirmClearSavedAddresses">{{ messages.productCheckout.confirmClearAddresses }}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { toTypedSchema } from "@vee-validate/zod";
import { Field as VeeField, useForm } from "vee-validate";
import { z } from "zod";
import { PackageOpenIcon } from "@lucide/vue";
import { toast } from "vue-sonner";
import { usePageContext } from "vike-vue/usePageContext";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PaymentMethodIcon from "@/components/storefront/PaymentMethodIcon.vue";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { clearLocalAddresses, getLocalAddresses, saveLocalAddress, type LocalAddress } from "@/lib/local-addresses";
import { useStorefrontPreferences } from "@/lib/storefront-preferences";
import { saveGuestOrder } from "@/lib/local-orders";
import { cacheQrPayment } from "@/lib/payment-utils";
import { runTelefunc, userErrorMessage } from "@/lib/telefunc-client";
import { onCreateAddress, onListAddresses } from "@/server/address/index.telefunc";
import { onGetPublicProductCheckout } from "@/server/catalog/public-product.telefunc";
import { onPreviewDiscount } from "@/server/discount/preview.telefunc";
import { onCreatePayment } from "@/server/payment/checkout.telefunc";
import type { PaymentChannel, PaymentProviderKind } from "@/server/payment/registry";

type CheckoutProduct = Awaited<ReturnType<typeof onGetPublicProductCheckout>>;

const props = withDefaults(defineProps<{ slug: string | null; layout?: "default" | "quickcard" }>(), { layout: "default" });
const isQuickcard = computed(() => props.layout === "quickcard");
const { messages, t } = useStorefrontPreferences();
const pageContext = usePageContext() as ReturnType<typeof usePageContext> & { user?: { id: string; email?: string | null } | null };
const user = pageContext.user ?? null;

const product = ref<CheckoutProduct | null>(null);
const loadingProduct = ref(false);
const loadError = ref("");
const selectedSkuId = ref("");
const selectedSku = computed(() => {
  if (!product.value?.skus.length) return null;
  return product.value.skus.find((sku) => String(sku.id) === selectedSkuId.value) ?? product.value.skus[0] ?? null;
});

type PaymentMethod = { key: string; provider: PaymentProviderKind; channel?: PaymentChannel; name: string };
const methods = computed<PaymentMethod[]>(() =>
  (product.value?.paymentProviders ?? []).flatMap((provider): PaymentMethod[] =>
    provider.channels.length
      ? provider.channels.map((channel) => ({ key: `${provider.provider}:${channel}`, provider: provider.provider, channel, name: provider.name }))
      : [{ key: `${provider.provider}:`, provider: provider.provider, name: provider.name }],
  ),
);
const selectedMethod = ref("");
const quantity = ref(1);
const contactValue = ref(user?.email?.trim() ?? "");
const discountCode = ref("");
const buyerNote = ref("");
const discountApplying = ref(false);
type DiscountPreview = Awaited<ReturnType<typeof onPreviewDiscount>>;
const discountPreview = ref<DiscountPreview | null>(null);
const submitting = ref(false);

type Address = Awaited<ReturnType<typeof onListAddresses>>[number];
type SavedAddress = Address | LocalAddress;
type AddressForm = { recipientName: string; phone: string; country: string; province: string; city: string; district: string; addressLine: string; postalCode: string };
const addresses = ref<SavedAddress[]>([]);
const addressesLoading = ref(false);
const selectedAddress = ref("new");
const previousAddressSelection = ref("new");
const clearAddressesDialogOpen = ref(false);
const savingAddress = ref(false);

const addressSchema = z.object({
  recipientName: z.string().trim().min(1, messages.value.productCheckout.validation.recipientNameRequired).max(100),
  phone: z.string().trim().regex(/^[0-9+()\-\s]{5,32}$/, messages.value.productCheckout.validation.phoneInvalid),
  country: z.string().trim().min(1, messages.value.productCheckout.validation.countryRequired).max(100),
  province: z.string().trim().min(1, messages.value.productCheckout.validation.provinceRequired).max(100),
  city: z.string().trim().min(1, messages.value.productCheckout.validation.cityRequired).max(100),
  district: z.string().trim().min(1, messages.value.productCheckout.validation.districtRequired).max(100),
  addressLine: z.string().trim().min(1, messages.value.productCheckout.validation.addressLineRequired).max(500),
  postalCode: z.string().trim().max(20).refine((value) => !value || /^[A-Za-z0-9][A-Za-z0-9\- ]{0,19}$/.test(value), messages.value.productCheckout.validation.postalCodeInvalid),
});
const { handleSubmit, validate, values } = useForm<AddressForm>({
  validationSchema: toTypedSchema(addressSchema),
  initialValues: { recipientName: "", phone: "", country: messages.value.productCheckout.address.defaultCountry, province: "", city: "", district: "", addressLine: "", postalCode: "" },
  keepValuesOnUnmount: true,
});
const addressFields = computed(() => [
  { name: "recipientName", label: messages.value.productCheckout.address.recipientName, autocomplete: "name", required: true },
  { name: "phone", label: messages.value.productCheckout.address.phone, autocomplete: "tel", required: true },
  { name: "country", label: messages.value.productCheckout.address.country, autocomplete: "country-name", required: true },
  { name: "province", label: messages.value.productCheckout.address.province, autocomplete: "address-level1", required: true },
  { name: "city", label: messages.value.productCheckout.address.city, autocomplete: "address-level2", required: true },
  { name: "district", label: messages.value.productCheckout.address.district, autocomplete: "address-level3", required: true },
  { name: "addressLine", label: messages.value.productCheckout.address.addressLine, autocomplete: "street-address", required: true, wide: true },
  { name: "postalCode", label: messages.value.productCheckout.address.postalCode, autocomplete: "postal-code", required: false },
] as const);
const addressFieldsWithoutPostalCode = computed(() => addressFields.value.filter((field) => field.name !== "postalCode"));

const requiresPayment = computed(() => (discountPreview.value?.finalAmount ?? selectedSku.value?.price) !== "0.00");
const isStockLimited = computed(() => selectedSku.value != null && selectedSku.value.availableStock !== null);
const availableStock = computed(() => selectedSku.value?.availableStock ?? 0);
const purchaseLimit = computed(() => {
  if (!selectedSku.value) return 1;
  return isStockLimited.value
    ? Math.max(selectedSku.value.minBuy, Math.min(selectedSku.value.maxBuy, availableStock.value))
    : selectedSku.value.maxBuy;
});
const isOutOfStock = computed(() => Boolean(selectedSku.value) && isStockLimited.value && availableStock.value < selectedSku.value!.minBuy);

watch(
  () => props.slug,
  async (slug) => {
    product.value = null;
    loadError.value = "";
    discountPreview.value = null;
    discountCode.value = "";
    buyerNote.value = "";
    if (!slug) return;
    loadingProduct.value = true;
    try {
      const data = await runTelefunc(() => onGetPublicProductCheckout({ slug }), { notifyError: false });
      product.value = data;
      selectedSkuId.value = String(data.skus[0]?.id ?? "");
      quantity.value = data.skus[0]?.minBuy ?? 1;
      selectedMethod.value = methods.value[0]?.key ?? "";
      await loadAddresses();
    } catch (cause) {
      loadError.value = userErrorMessage(cause, "加载商品失败");
    } finally {
      loadingProduct.value = false;
    }
  },
  { immediate: true },
);

watch(selectedSku, (sku) => {
  if (sku) {
    quantity.value = sku.minBuy;
    discountPreview.value = null;
    void loadAddresses();
  }
});
watch(methods, (list) => {
  if (!list.some((item) => item.key === selectedMethod.value)) selectedMethod.value = list[0]?.key ?? "";
});
watch([discountCode, quantity], () => {
  discountPreview.value = null;
});

async function onApplyDiscount() {
  if (!product.value || !selectedSku.value) return;
  const code = discountCode.value;
  if (!code.trim()) return;
  const requestedQuantity = quantity.value;
  const requestedSkuId = selectedSku.value.id;
  discountPreview.value = null;
  discountApplying.value = true;
  try {
    const preview = await runTelefunc(() => onPreviewDiscount({ productId: product.value!.id, productSkuId: requestedSkuId, quantity: requestedQuantity, discountCode: code }), { notifyError: false });
    if (discountCode.value === code && quantity.value === requestedQuantity && selectedSku.value.id === requestedSkuId) discountPreview.value = preview;
  } catch (cause) {
    if (discountCode.value === code && quantity.value === requestedQuantity && selectedSku.value.id === requestedSkuId) toast.error(userErrorMessage(cause, messages.value.productCheckout.discountPreviewFailed));
  } finally {
    discountApplying.value = false;
  }
}

async function onSubmit(address: AddressForm) {
  if (!product.value || !selectedSku.value) return;
  if (isOutOfStock.value || (isStockLimited.value && quantity.value > availableStock.value)) {
    toast.error(messages.value.productCheckout.insufficientStock);
    return;
  }
  if (discountCode.value.trim() && !discountPreview.value) {
    toast.info(messages.value.productCheckout.applyDiscountFirst);
    return;
  }
  const method = methods.value.find((item) => item.key === selectedMethod.value);
  if (!method && requiresPayment.value) {
    toast.error(messages.value.productCheckout.noPaymentMethod);
    return;
  }
  const savedAddress = addresses.value.find((item) => String(item.id) === selectedAddress.value);
  const useStoredAddress = selectedSku.value.deliveryType === "EXPRESS" && selectedAddress.value !== "new" && savedAddress;
  const expressAddress =
    selectedSku.value.deliveryType === "EXPRESS"
      ? useStoredAddress
        ? user
          ? { addressId: Number(savedAddress.id) }
          : {
              address: {
                recipientName: savedAddress.recipientName,
                phone: savedAddress.phone,
                country: savedAddress.country,
                province: savedAddress.province,
                city: savedAddress.city,
                district: savedAddress.district,
                addressLine: savedAddress.addressLine,
                postalCode: savedAddress.postalCode || undefined,
              },
            }
        : { address: { ...address, postalCode: address.postalCode || undefined } }
      : {};
  submitting.value = true;
  try {
    const created = await runTelefunc(
      () =>
        onCreatePayment({
          productId: product.value!.id,
          productSkuId: selectedSku.value.id,
          quantity: quantity.value,
          paymentProvider: method?.provider ?? "ALIPAY",
          paymentChannel: method?.channel,
          contactType: "EMAIL",
          contactValue: contactValue.value,
          ...expressAddress,
          discountCode: discountPreview.value?.code,
          buyerNote: buyerNote.value,
        }),
      { notifyError: false },
    );
    if (!pageContext.user) {
      saveGuestOrder(contactValue.value, {
        orderNo: created.orderNo,
        productName: product.value.name,
        amount: requiresPayment.value ? (discountPreview.value?.finalAmount ?? selectedSku.value.price) : "0.00",
        createdAt: new Date().toISOString(),
      });
    }
    if (created.payment?.mode === "redirect" && created.payment.url) {
      window.location.assign(created.payment.url);
      return;
    }
    if (created.payment?.mode === "qr") {
      cacheQrPayment(created);
      window.location.assign(`/checkout?orderNo=${encodeURIComponent(created.orderNo)}`);
      return;
    }
    window.location.assign(`${pageContext.user ? "/account/order" : "/order"}?orderNo=${encodeURIComponent(created.orderNo)}`);
  } catch (cause) {
    toast.error(userErrorMessage(cause, messages.value.productCheckout.orderSubmissionFailed));
  } finally {
    submitting.value = false;
  }
}

const submitAddress = handleSubmit(onSubmit, () => toast.error(messages.value.productCheckout.shippingAddressIncomplete));
function submit(event: Event) {
  const requiresAddressForm = selectedSku.value?.deliveryType === "EXPRESS" && (!user || selectedAddress.value === "new" || !addresses.value.length);
  if (requiresAddressForm) return submitAddress(event);
  void onSubmit({ recipientName: "", phone: "", country: "", province: "", city: "", district: "", addressLine: "", postalCode: "" });
}

async function saveCurrentAddress() {
  const result = await validate();
  if (!result.valid) {
    toast.error(messages.value.productCheckout.shippingAddressIncomplete);
    return;
  }
  savingAddress.value = true;
  try {
    const input = { ...values, postalCode: values.postalCode || undefined, isDefault: addresses.value.length === 0 };
    const saved = user ? await runTelefunc(() => onCreateAddress(input), { notifyError: false }) : saveLocalAddress({ ...input, postalCode: input.postalCode ?? null });
    if (!saved) {
      toast.error(messages.value.productCheckout.addressSaveStorageFailed);
      return;
    }
    addresses.value = [...addresses.value, saved];
    selectedAddress.value = String(saved.id);
    toast.success(messages.value.productCheckout.addressSaved);
  } catch (cause) {
    toast.error(userErrorMessage(cause, messages.value.productCheckout.addressSaveFailed));
  } finally {
    savingAddress.value = false;
  }
}

function onAddressSelectionChange(value: unknown) {
  if (value === "clear-local-addresses") {
    previousAddressSelection.value = selectedAddress.value;
    clearAddressesDialogOpen.value = true;
    return;
  }
  if (typeof value === "string") selectedAddress.value = value;
}

function confirmClearSavedAddresses() {
  if (!clearLocalAddresses()) {
    toast.error(messages.value.productCheckout.clearAddressesFailed);
    return;
  }
  addresses.value = [];
  selectedAddress.value = "new";
  clearAddressesDialogOpen.value = false;
  toast.success(messages.value.productCheckout.addressesCleared);
}

async function loadAddresses() {
  if (selectedSku.value?.deliveryType !== "EXPRESS") return;
  addressesLoading.value = true;
  try {
    addresses.value = user ? await runTelefunc(() => onListAddresses(), { notifyError: false }) : getLocalAddresses();
    const preferred = addresses.value.find((item) => item.isDefault) ?? addresses.value[0];
    selectedAddress.value = preferred ? String(preferred.id) : "new";
  } catch (cause) {
    toast.error(userErrorMessage(cause, messages.value.productCheckout.addressLoadFailed));
    selectedAddress.value = "new";
  } finally {
    addressesLoading.value = false;
  }
}

function formatPaymentName(item: { name?: string; provider?: string; channel?: string }) {
  const raw = (item.name || "").trim();
  const provider = (item.provider || "").toUpperCase();
  const channel = (item.channel || "").toLowerCase();
  if (channel === "alipay" || provider === "ALIPAY" || raw.includes("支付宝")) return "支付宝";
  if (channel === "wxpay" || raw.includes("微信")) return "微信支付";
  if (provider === "BEPUSDT" || provider === "HASHPAY" || raw.toLowerCase().includes("usdt")) return "USDT";
  if (provider === "STRIPE" || raw.toLowerCase().includes("stripe")) return "Stripe";
  if (provider === "PERPAY" || raw.toLowerCase().includes("perpay")) return "PerPay";
  return raw.replace(/^快捷支付[（(]/, "").replace(/[）)]$/, "").trim() || raw;
}
</script>
