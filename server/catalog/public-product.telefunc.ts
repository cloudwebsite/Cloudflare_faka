import { getContext } from "telefunc";
import { appError } from "@/lib/app-error";
import { telefuncAction } from "@/server/telefunc-action";
import { getPublicProductDetail } from "@/server/catalog/public";
import { getEnabledPaymentProviders } from "@/server/payment/config";

type RuntimeContext = { env?: { DB?: D1Database } };

async function internalOnGetPublicProductCheckout(input: { slug: string }) {
  const context = getContext<RuntimeContext>();
  if (!context.env?.DB) appError("DATABASE_UNAVAILABLE");
  const slug = input.slug?.trim() ?? "";
  if (!slug) appError("PRODUCT_NOT_FOUND");
  const product = await getPublicProductDetail(context.env.DB, slug);
  if (!product) appError("PRODUCT_NOT_FOUND");
  const paymentProviders = await getEnabledPaymentProviders(context.env.DB);
  return { ...product, paymentProviders };
}

export const onGetPublicProductCheckout = telefuncAction(internalOnGetPublicProductCheckout);
