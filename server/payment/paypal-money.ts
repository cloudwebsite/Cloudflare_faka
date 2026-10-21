export type PaypalCurrency = "USD" | "EUR" | "GBP" | "HKD" | "JPY";

const ZERO_DECIMAL = new Set<PaypalCurrency>(["JPY"]);

export type PaypalConvertedAmount = {
  currency: PaypalCurrency;
  /** Minor units (cents) for USD/EUR/GBP/HKD; whole yen for JPY. */
  minor: number;
  /** Value sent to PayPal `amount.value`. */
  value: string;
};

/** Half-up rounding for non-negative numbers. */
function roundHalfUp(value: number) {
  return Math.floor(value + 0.5);
}

/**
 * Convert store CNY cents to PayPal charge amount using a fixed rate.
 * `cnyPerUnit` means 1 unit of `currency` equals that many CNY (e.g. 7.25 → 1 USD = ¥7.25).
 */
export function convertCnyCentsToPaypalAmount(orderAmountCents: number, currency: PaypalCurrency, cnyPerUnit: string): PaypalConvertedAmount {
  if (!Number.isSafeInteger(orderAmountCents) || orderAmountCents < 0) throw new Error("PAYPAL_AMOUNT_INVALID");
  const rate = Number(cnyPerUnit);
  if (!Number.isFinite(rate) || rate <= 0) throw new Error("PAYPAL_RATE_INVALID");
  const foreignMajor = orderAmountCents / 100 / rate;
  if (ZERO_DECIMAL.has(currency)) {
    const minor = roundHalfUp(foreignMajor);
    if (minor <= 0) throw new Error("PAYPAL_AMOUNT_TOO_SMALL");
    return { currency, minor, value: String(minor) };
  }
  const minor = roundHalfUp(foreignMajor * 100);
  if (minor <= 0) throw new Error("PAYPAL_AMOUNT_TOO_SMALL");
  return { currency, minor, value: (minor / 100).toFixed(2) };
}

export function parsePaypalAmountValue(value: string, currency: PaypalCurrency): number | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  if (ZERO_DECIMAL.has(currency)) {
    if (!/^\d+$/.test(value.trim())) return undefined;
    const minor = Number(value.trim());
    return Number.isSafeInteger(minor) ? minor : undefined;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return undefined;
  const minor = roundHalfUp(Number(value.trim()) * 100);
  return Number.isSafeInteger(minor) ? minor : undefined;
}

export function paypalAmountsEqual(left: PaypalConvertedAmount, gatewayValue: string) {
  const parsed = parsePaypalAmountValue(gatewayValue, left.currency);
  return parsed !== undefined && parsed === left.minor;
}
