import {
  BASE_CURRENCY,
  convertFromBaseMinor,
  formatMinor,
  isCurrencyCode,
  rateForCurrency,
  type CurrencyCode,
} from "@/lib/money";

/** Quote a CNY-fen net amount in a settlement currency (scheme C + P ceil). */
export function quoteChargeFromBase(
  baseMinor: number,
  currency: string | undefined,
  rates: Partial<Record<CurrencyCode, number>> | Record<string, number> | undefined,
) {
  const code: CurrencyCode = isCurrencyCode(currency) ? currency : BASE_CURRENCY;
  const rate = rateForCurrency((rates ?? {}) as Record<CurrencyCode, number>, code);
  if (rate === null) {
    return { currency: code, rate: null as number | null, amountMinor: 0, formatted: formatMinor(0, code), rateMissing: true as const };
  }
  const amountMinor = convertFromBaseMinor(baseMinor, code, rate);
  return { currency: code, rate, amountMinor, formatted: formatMinor(amountMinor, code), rateMissing: false as const };
}
