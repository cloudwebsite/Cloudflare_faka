import { BASE_CURRENCY, isCurrencyCode, type CurrencyCode } from "@/lib/money";
import { getProviderDefinition, type PaymentProviderKind } from "./registry";

function uniqueCurrencies(codes: CurrencyCode[]): CurrencyCode[] {
  const seen = new Set<CurrencyCode>();
  const out: CurrencyCode[] = [];
  for (const code of codes) {
    if (seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out.length ? out : [BASE_CURRENCY];
}

function readConfigCurrencies(config: Record<string, unknown>): CurrencyCode[] {
  const fromList: CurrencyCode[] = [];
  if (Array.isArray(config.currencies)) {
    for (const item of config.currencies) {
      if (typeof item !== "string") continue;
      const code = item.trim().toUpperCase();
      if (isCurrencyCode(code)) fromList.push(code);
    }
  }
  if (fromList.length) return uniqueCurrencies(fromList);
  const raw = typeof config.currency === "string" ? config.currency.trim().toUpperCase() : "";
  if (isCurrencyCode(raw)) return [raw];
  return [];
}

/**
 * All settlement currencies a payment provider may charge (scheme C / M2).
 * Config-driven providers read `currencies` (or legacy single `currency`);
 * others use `supportedCurrencies`.
 */
export function providerSettleCurrencies(provider: PaymentProviderKind | string, config: Record<string, unknown>): CurrencyCode[] {
  const definition = getProviderDefinition(provider);
  if (!definition) return [BASE_CURRENCY];

  if (definition.supportedCurrencies === "config") {
    const fromConfig = readConfigCurrencies(config);
    return uniqueCurrencies(fromConfig.length ? fromConfig : [BASE_CURRENCY]);
  }

  const fixed = definition.supportedCurrencies.filter(isCurrencyCode);
  return uniqueCurrencies(fixed.length ? [...fixed] : [BASE_CURRENCY]);
}

/**
 * Default settlement currency (first allowed). Prefer `providerSettleCurrencies`
 * + explicit buyer choice for multi-currency (M2).
 */
export function providerSettleCurrency(provider: PaymentProviderKind | string, config: Record<string, unknown>): CurrencyCode {
  return providerSettleCurrencies(provider, config)[0] ?? BASE_CURRENCY;
}

/** Whether `currency` is allowed for this provider config. */
export function providerAllowsSettleCurrency(
  provider: PaymentProviderKind | string,
  config: Record<string, unknown>,
  currency: CurrencyCode,
): boolean {
  return providerSettleCurrencies(provider, config).includes(currency);
}

/**
 * Overlay order settle currency onto provider config before createAdapter,
 * so Stripe/PayPal/HashPay charge the buyer's chosen currency (M2).
 */
export function withOrderSettleCurrency(
  provider: PaymentProviderKind | string,
  config: Record<string, unknown>,
  settleCurrency: string,
): Record<string, unknown> {
  if (!isCurrencyCode(settleCurrency)) return { ...config };
  if (provider === "STRIPE") return { ...config, currency: settleCurrency.toLowerCase() };
  if (provider === "PAYPAL" || provider === "HASHPAY") return { ...config, currency: settleCurrency.toUpperCase() };
  return { ...config };
}
