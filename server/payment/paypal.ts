import type { PaypalConfig } from "@/lib/config-schemas";
import { convertCnyCentsToPaypalAmount, paypalAmountsEqual, type PaypalCurrency } from "./paypal-money";
import type { PaymentAdapter, PaymentNotifyResult, PaymentQueryResult } from "./types";

type PaypalOrderResource = {
  id?: string;
  status?: string;
  purchase_units?: Array<{
    custom_id?: string;
    reference_id?: string;
    amount?: { currency_code?: string; value?: string };
  }>;
  links?: Array<{ rel?: string; href?: string }>;
};

type PaypalWebhookEvent = {
  id?: string;
  event_type?: string;
  resource?: Record<string, unknown>;
};

function apiBase(environment: PaypalConfig["environment"]) {
  return environment === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

function result(values: Partial<PaymentNotifyResult> & Pick<PaymentNotifyResult, "verified" | "status" | "message">): PaymentNotifyResult {
  return { provider: "PAYPAL", ...values };
}

function basicAuth(clientId: string, clientSecret: string) {
  return `Basic ${btoa(`${clientId}:${clientSecret}`)}`;
}

function isAllowedCertUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return host === "api.paypal.com" || host === "api.sandbox.paypal.com";
  } catch {
    return false;
  }
}

async function getAccessToken(config: PaypalConfig) {
  const response = await fetch(`${apiBase(config.environment)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: basicAuth(config.clientId, config.clientSecret),
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json() as { access_token?: string };
  if (!response.ok || !body.access_token) throw new Error("PAYPAL_AUTH_FAILED");
  return body.access_token;
}

async function paypalFetch<T>(config: PaypalConfig, path: string, init: RequestInit = {}): Promise<{ ok: boolean; status: number; body: T; raw: string }> {
  const token = await getAccessToken(config);
  const response = await fetch(`${apiBase(config.environment)}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  const raw = await response.text();
  let body: T;
  try {
    body = JSON.parse(raw) as T;
  } catch {
    throw new Error("PAYPAL_INVALID_RESPONSE");
  }
  return { ok: response.ok, status: response.status, body, raw };
}

function unitOrderNo(unit: { custom_id?: string; reference_id?: string } | undefined) {
  const customId = unit?.custom_id?.trim() ?? "";
  const referenceId = unit?.reference_id?.trim() ?? "";
  if (customId && referenceId && customId !== referenceId) return null;
  return customId || referenceId || null;
}

function extractOrderFields(resource: PaypalOrderResource, expectedOrderNo?: string) {
  const unit = resource.purchase_units?.[0];
  const orderNo = unitOrderNo(unit);
  if (!orderNo) return null;
  if (expectedOrderNo && orderNo !== expectedOrderNo) return null;
  const currency = unit?.amount?.currency_code?.toUpperCase() as PaypalCurrency | undefined;
  const value = unit?.amount?.value;
  if (!currency || !value) return null;
  return { orderNo, currency, value, paymentOrderNo: resource.id, status: resource.status };
}

async function getCheckoutOrder(config: PaypalConfig, paymentOrderNo: string) {
  return paypalFetch<PaypalOrderResource>(config, `/v2/checkout/orders/${encodeURIComponent(paymentOrderNo)}`);
}

async function captureCheckoutOrder(config: PaypalConfig, paymentOrderNo: string) {
  const captured = await paypalFetch<PaypalOrderResource & { name?: string; details?: Array<{ issue?: string }> }>(config, `/v2/checkout/orders/${encodeURIComponent(paymentOrderNo)}/capture`, {
    method: "POST",
    body: "{}",
  });
  if (captured.ok) return captured;
  const alreadyCaptured = captured.body.name === "UNPROCESSABLE_ENTITY"
    && captured.body.details?.some((detail) => detail.issue === "ORDER_ALREADY_CAPTURED");
  if (alreadyCaptured) return getCheckoutOrder(config, paymentOrderNo);
  return captured;
}

function matchesExpected(config: PaypalConfig, orderAmountCents: number, fields: { orderNo: string; currency: string; value: string }, expectedOrderNo: string) {
  if (fields.orderNo !== expectedOrderNo) return false;
  if (fields.currency !== config.currency) return false;
  const expected = convertCnyCentsToPaypalAmount(orderAmountCents, config.currency, config.cnyPerUnit);
  return paypalAmountsEqual(expected, fields.value);
}

async function evaluateCheckoutOrder(config: PaypalConfig, paymentOrderNo: string, orderNo: string, orderAmountCents: number): Promise<PaymentQueryResult> {
  let fetched = await getCheckoutOrder(config, paymentOrderNo);
  if (!fetched.ok) return result({ verified: false, orderNo, paymentOrderNo, status: "PENDING", message: "PAYPAL_QUERY_FAILED" });

  if (fetched.body.status === "APPROVED") {
    fetched = await captureCheckoutOrder(config, paymentOrderNo);
    if (!fetched.ok && fetched.body.status !== "COMPLETED") {
      return result({ verified: false, orderNo, paymentOrderNo, status: "PENDING", message: "PAYPAL_CAPTURE_FAILED" });
    }
    if (fetched.body.status !== "COMPLETED") {
      const refreshed = await getCheckoutOrder(config, paymentOrderNo);
      if (!refreshed.ok) return result({ verified: false, orderNo, paymentOrderNo, status: "PENDING", message: "PAYPAL_QUERY_FAILED" });
      fetched = refreshed;
    }
  }

  const fields = extractOrderFields(fetched.body, orderNo);
  if (!fields) return result({ verified: false, orderNo, paymentOrderNo, status: "PENDING", message: "PAYPAL_QUERY_MISMATCH" });

  if (fields.status === "COMPLETED") {
    if (!matchesExpected(config, orderAmountCents, fields, orderNo)) {
      return result({ verified: false, orderNo, paymentOrderNo: fields.paymentOrderNo, status: "PENDING", message: "PAYPAL_AMOUNT_MISMATCH", currency: fields.currency });
    }
    return result({
      verified: true,
      orderNo,
      paymentOrderNo: fields.paymentOrderNo,
      amount: orderAmountCents,
      currency: fields.currency,
      status: "PAID",
      message: "PAYPAL_QUERY",
    });
  }

  return result({
    verified: true,
    orderNo,
    paymentOrderNo: fields.paymentOrderNo,
    status: "PENDING",
    message: "PAYPAL_PENDING",
    currency: fields.currency,
  });
}

async function verifyWebhookSignature(config: PaypalConfig, rawBody: string, headers: Headers | undefined) {
  if (!config.webhookId.trim()) return false;
  const transmissionId = headers?.get("PAYPAL-TRANSMISSION-ID") ?? "";
  const transmissionTime = headers?.get("PAYPAL-TRANSMISSION-TIME") ?? "";
  const transmissionSig = headers?.get("PAYPAL-TRANSMISSION-SIG") ?? "";
  const certUrl = headers?.get("PAYPAL-CERT-URL") ?? "";
  const authAlgo = headers?.get("PAYPAL-AUTH-ALGO") ?? "";
  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) return false;
  if (!isAllowedCertUrl(certUrl)) return false;
  let webhookEvent: unknown;
  try {
    webhookEvent = JSON.parse(rawBody);
  } catch {
    return false;
  }
  const response = await paypalFetch<{ verification_status?: string }>(config, "/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: config.webhookId,
      webhook_event: webhookEvent,
    }),
  });
  return response.ok && response.body.verification_status === "SUCCESS";
}

function orderIdFromWebhookResource(resource: Record<string, unknown>, eventType: string) {
  if (eventType === "CHECKOUT.ORDER.APPROVED") {
    return typeof resource.id === "string" ? resource.id : undefined;
  }
  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const supplementary = resource.supplementary_data as { related_ids?: { order_id?: string } } | undefined;
    if (typeof supplementary?.related_ids?.order_id === "string") return supplementary.related_ids.order_id;
    const customId = typeof resource.custom_id === "string" ? resource.custom_id : undefined;
    return customId ? undefined : undefined;
  }
  return undefined;
}

function orderNoFromWebhookResource(resource: Record<string, unknown>, eventType: string) {
  if (eventType === "CHECKOUT.ORDER.APPROVED") {
    return unitOrderNo((resource as PaypalOrderResource).purchase_units?.[0]);
  }
  if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
    const customId = typeof resource.custom_id === "string" ? resource.custom_id.trim() : "";
    return customId || null;
  }
  return null;
}

export function createPaypalAdapter(config: PaypalConfig): PaymentAdapter {
  return {
    create: async (input) => {
      const converted = convertCnyCentsToPaypalAmount(input.amount, config.currency, config.cnyPerUnit);
      const body = {
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: input.orderNo,
          custom_id: input.orderNo,
          description: input.subject.slice(0, 127),
          amount: {
            currency_code: converted.currency,
            value: converted.value,
          },
        }],
        application_context: {
          return_url: input.returnUrl,
          cancel_url: input.returnUrl,
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
        },
      };
      const created = await paypalFetch<PaypalOrderResource>(config, "/v2/checkout/orders", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const approve = created.body.links?.find((link) => link.rel === "approve")?.href;
      if (!created.ok || !created.body.id || !approve) throw new Error("PAYPAL_CREATE_FAILED");
      return {
        mode: "redirect",
        url: approve,
        paymentOrderNo: created.body.id,
        payableAmount: converted.minor,
      };
    },

    verify: async ({ rawBody = "", headers }) => {
      if (!config.webhookId.trim()) {
        return result({ verified: false, status: "FAILED", message: "PAYPAL_WEBHOOK_NOT_CONFIGURED" });
      }
      const signed = await verifyWebhookSignature(config, rawBody, headers);
      if (!signed) return result({ verified: false, status: "FAILED", message: "PAYPAL_WEBHOOK_VERIFY_FAILED" });

      let event: PaypalWebhookEvent;
      try {
        event = JSON.parse(rawBody) as PaypalWebhookEvent;
      } catch {
        return result({ verified: false, status: "FAILED", message: "PAYPAL_INVALID_JSON" });
      }

      const eventType = event.event_type ?? "";
      if (eventType !== "PAYMENT.CAPTURE.COMPLETED" && eventType !== "CHECKOUT.ORDER.APPROVED") {
        return result({ verified: false, status: "PENDING", message: "PAYPAL_WEBHOOK_IGNORED" });
      }

      const resource = event.resource && typeof event.resource === "object" ? event.resource : null;
      if (!resource) return result({ verified: false, status: "FAILED", message: "PAYPAL_WEBHOOK_INVALID" });

      const orderNo = orderNoFromWebhookResource(resource, eventType);
      let paymentOrderNo = orderIdFromWebhookResource(resource, eventType);

      if (eventType === "CHECKOUT.ORDER.APPROVED") {
        paymentOrderNo = typeof resource.id === "string" ? resource.id : paymentOrderNo;
        if (paymentOrderNo) {
          await captureCheckoutOrder(config, paymentOrderNo);
        }
      }

      if (eventType === "PAYMENT.CAPTURE.COMPLETED" && !paymentOrderNo) {
        const supplementary = resource.supplementary_data as { related_ids?: { order_id?: string } } | undefined;
        paymentOrderNo = supplementary?.related_ids?.order_id;
      }

      if (!orderNo) return result({ verified: false, status: "FAILED", message: "PAYPAL_WEBHOOK_INVALID" });

      // Amount is finalized in PaymentCallbackService via query(order.amount).
      return result({
        verified: true,
        orderNo,
        paymentOrderNo,
        status: "PAID",
        message: "PAYPAL_CALLBACK",
      });
    },

    query: async ({ orderNo, paymentOrderNo, amount }) => {
      if (!paymentOrderNo) return result({ verified: false, orderNo, status: "PENDING", message: "PAYPAL_ORDER_ID_MISSING" });
      try {
        return await evaluateCheckoutOrder(config, paymentOrderNo, orderNo, amount);
      } catch {
        return result({ verified: false, orderNo, paymentOrderNo, status: "PENDING", message: "PAYPAL_QUERY_FAILED" });
      }
    },
  };
}
