/**
 * Currency helpers (scheme C + P).
 *
 * - SKU prices persist as CNY minor units (fen).
 * - Settlement currency comes from the selected payment provider.
 * - Conversion uses fixed-point precision (AMOUNT_SCALE), then ceil to the
 *   charge currency's minor unit (e.g. under 1¢ → 1¢).
 *
 * Rate semantics: `1 CNY = rate units of currency` (e.g. 0.149 USD).
 */

export const SUPPORTED_CURRENCIES = [
  { code: "CNY", name: "人民币", decimals: 2, symbol: "¥" },
  { code: "USD", name: "美元", decimals: 2, symbol: "$" },
  { code: "TWD", name: "新台币", decimals: 2, symbol: "$" },
  { code: "JPY", name: "日元", decimals: 0, symbol: "¥" },
  { code: "EUR", name: "欧元", decimals: 2, symbol: "€" },
  { code: "GBP", name: "英镑", decimals: 2, symbol: "£" },
  { code: "HKD", name: "港币", decimals: 2, symbol: "HK$" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];
export type CurrencyMeta = (typeof SUPPORTED_CURRENCIES)[number];

export const BASE_CURRENCY: CurrencyCode = "CNY";

/** Internal fixed-point scale: 1 major unit = 10^AMOUNT_SCALE precise units. */
export const AMOUNT_SCALE = 6;

const CURRENCY_BY_CODE = new Map(SUPPORTED_CURRENCIES.map((item) => [item.code, item]));

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && CURRENCY_BY_CODE.has(value as CurrencyCode);
}

export function currencyMeta(code: CurrencyCode): CurrencyMeta {
  return CURRENCY_BY_CODE.get(code) ?? CURRENCY_BY_CODE.get(BASE_CURRENCY)!;
}

/** Example: `CNY-人民币`. */
export function currencyLabel(code: CurrencyCode): string {
  const meta = currencyMeta(code);
  return `${meta.code}-${meta.name}`;
}

export function currencyDecimals(code: CurrencyCode): number {
  return currencyMeta(code).decimals;
}

/** Charge/ISO decimals for a currency (same as display decimals today). */
export function currencyChargeDecimals(code: CurrencyCode): number {
  return currencyDecimals(code);
}

/** A valid rate is a finite positive number. Bounds are intentionally not enforced. */
export function parseExchangeRate(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(String(value ?? "").trim());
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

export function isValidExchangeRate(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/**
 * Convert CNY fen into high-precision units of `currency`.
 * `rate` is "1 CNY = rate units of currency".
 */
export function convertFromBaseToPrecise(baseMinor: number, currency: CurrencyCode, rate: number): number {
  if (!Number.isSafeInteger(baseMinor) || baseMinor < 0) return 0;
  if (currency === BASE_CURRENCY) return baseMinor * 10 ** (AMOUNT_SCALE - 2);
  if (!isValidExchangeRate(rate)) return 0;
  return Math.max(0, Math.round(baseMinor * rate * 10 ** (AMOUNT_SCALE - 2)));
}

/**
 * Ceil a precise amount to the currency's charge minor units.
 * Positive amounts below one minor unit become 1 (e.g. $0.00149 → 1¢).
 */
export function ceilPreciseToCharge(precise: number, currency: CurrencyCode): number {
  if (!Number.isSafeInteger(precise) || precise < 0) return 0;
  if (precise === 0) return 0;
  const divisor = 10 ** (AMOUNT_SCALE - currencyChargeDecimals(currency));
  return Math.max(1, Math.ceil(precise / divisor));
}

/**
 * Convert CNY fen into charge minor units (precise → ceil).
 * Prefer this for settlement amounts.
 */
export function convertFromBaseMinor(baseMinor: number, currency: CurrencyCode, rate: number): number {
  return ceilPreciseToCharge(convertFromBaseToPrecise(baseMinor, currency, rate), currency);
}

/** Convert charge minor units back to CNY fen. */
export function convertToBaseMinor(amountMinor: number, currency: CurrencyCode, rate: number): number {
  if (!Number.isSafeInteger(amountMinor) || amountMinor < 0) return 0;
  if (currency === BASE_CURRENCY) return amountMinor;
  if (!isValidExchangeRate(rate)) return 0;
  const scale = 10 ** (2 - currencyDecimals(currency));
  return Math.max(0, Math.round((amountMinor / rate) * scale));
}

export function minorToAmount(amountMinor: number, currency: CurrencyCode): number {
  return amountMinor / 10 ** currencyDecimals(currency);
}

export function preciseToAmount(precise: number): number {
  return precise / 10 ** AMOUNT_SCALE;
}

/** Convert a decimal amount (e.g. a provider callback value) into minor units. */
export function amountToMinor(amount: number, currency: CurrencyCode): number {
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount * 10 ** currencyDecimals(currency));
}

/** Format a charge minor-unit amount with the currency symbol, e.g. `$1.49`. */
export function formatMinor(amountMinor: number, currency: CurrencyCode, locale = "zh-CN"): string {
  const meta = currencyMeta(currency);
  const safeAmount = Number.isSafeInteger(amountMinor) && amountMinor >= 0 ? amountMinor : 0;
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  }).format(minorToAmount(safeAmount, currency));
  return `${meta.symbol}${number}`;
}

/** Format a precise amount for browse UI (up to 6 fraction digits, trim zeros). */
export function formatPrecise(precise: number, currency: CurrencyCode, locale = "zh-CN"): string {
  const meta = currencyMeta(currency);
  const safe = Number.isSafeInteger(precise) && precise >= 0 ? precise : 0;
  const number = new Intl.NumberFormat(locale, {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: AMOUNT_SCALE,
  }).format(preciseToAmount(safe));
  return `${meta.symbol}${number}`;
}

export function formatCnyMinor(amountMinor: number, locale = "zh-CN"): string {
  return formatMinor(amountMinor, BASE_CURRENCY, locale);
}

/** Example: `1人民币 = 0.149美元`. */
export function formatRate(currency: CurrencyCode, rate: number): string {
  const value = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 8 }).format(rate);
  return `1人民币 = ${value}${currencyMeta(currency).name}`;
}

export type CurrencyRatesMap = Partial<Record<CurrencyCode, number>>;

/** Parse `currencyRatesJson`; always includes CNY=1. */
export function parseCurrencyRatesJson(json: string | null | undefined, fallbackCurrency?: CurrencyCode, fallbackRate?: number): Record<CurrencyCode, number> {
  const rates = {} as Record<CurrencyCode, number>;
  rates[BASE_CURRENCY] = 1;
  if (typeof json === "string" && json.trim()) {
    try {
      const parsed = JSON.parse(json) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        for (const [key, value] of Object.entries(parsed)) {
          if (!isCurrencyCode(key)) continue;
          const rate = parseExchangeRate(value);
          if (rate !== null) rates[key] = key === BASE_CURRENCY ? 1 : rate;
        }
      }
    } catch {
      // ignore malformed JSON
    }
  }
  if (fallbackCurrency && fallbackCurrency !== BASE_CURRENCY) {
    const rate = parseExchangeRate(fallbackRate);
    if (rate !== null && rates[fallbackCurrency] === undefined) rates[fallbackCurrency] = rate;
  }
  return rates;
}

export function rateForCurrency(rates: Record<CurrencyCode, number> | CurrencyRatesMap, currency: CurrencyCode): number | null {
  if (currency === BASE_CURRENCY) return 1;
  const rate = rates[currency];
  return isValidExchangeRate(rate ?? NaN) ? rate! : null;
}

export function stringifyCurrencyRates(rates: CurrencyRatesMap): string {
  const out: Record<string, number> = { CNY: 1 };
  for (const item of SUPPORTED_CURRENCIES) {
    if (item.code === BASE_CURRENCY) continue;
    const rate = rates[item.code];
    if (isValidExchangeRate(rate ?? NaN)) out[item.code] = rate!;
  }
  return JSON.stringify(out);
}
