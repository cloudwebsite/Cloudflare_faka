export type PaypalCurrency = "USD" | "EUR" | "GBP" | "HKD" | "JPY";

const ZERO_DECIMAL = new Set<PaypalCurrency>(["JPY"]);

export type PaypalConvertedAmount = {
  currency: PaypalCurrency;
  /** Minor units (cents) for USD/EUR/GBP/HKD; whole yen for JPY. */
  minor: number;
  /** Value sent to PayPal `amount.value`. */
  value: string;
};

/**
 * Format a store-currency minor-unit amount for PayPal Checkout.
 * Same-currency passthrough (aligned with Stripe): no FX — `order.amount` is already
 * in the PayPal config currency's minor units.
 */
export function formatPaypalAmountFromMinor(orderAmountMinor: number, currency: PaypalCurrency): PaypalConvertedAmount {
  if (!Number.isSafeInteger(orderAmountMinor) || orderAmountMinor < 0) throw new Error("PAYPAL_AMOUNT_INVALID");
  if (orderAmountMinor <= 0) throw new Error("PAYPAL_AMOUNT_TOO_SMALL");
  if (ZERO_DECIMAL.has(currency)) {
    return { currency, minor: orderAmountMinor, value: String(orderAmountMinor) };
  }
  return { currency, minor: orderAmountMinor, value: (orderAmountMinor / 100).toFixed(2) };
}

export function parsePaypalAmountValue(value: string, currency: PaypalCurrency): number | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (ZERO_DECIMAL.has(currency)) {
    if (!/^\d+$/.test(value.trim())) return undefined;
    const minor = Number(value.trim());
    return Number.isSafeInteger(minor) ? minor : undefined;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return undefined;
  const minor = Math.round(Number(value.trim()) * 100);
  return Number.isSafeInteger(minor) ? minor : undefined;
}

export function paypalAmountsEqual(left: PaypalConvertedAmount, gatewayValue: string) {
  const parsed = parsePaypalAmountValue(gatewayValue, left.currency);
  return parsed !== undefined && parsed === left.minor;
}
