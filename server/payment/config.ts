import { asc, eq } from "drizzle-orm";
import { createDrizzleDb } from "@/database/drizzle";
import { paymentProvider } from "@/database/drizzle/schema";
import { appError } from "@/lib/app-error";
import type { CurrencyCode } from "@/lib/money";
import { parseProviderConfig, getProviderDefinition, type PaymentChannel, type PaymentProviderKind, type ProviderDefinition } from "./registry";
import { providerAllowsSettleCurrency, providerSettleCurrencies, providerSettleCurrency } from "./settle-currency";

export type { PaymentProviderKind } from "./registry";

export type PublicPaymentProvider = {
  provider: PaymentProviderKind;
  name: string;
  channels: PaymentChannel[];
  /** Default settlement currency (first of currencies). */
  currency: CurrencyCode;
  /** All settlement currencies this provider may charge (scheme C / M2). */
  currencies: CurrencyCode[];
  configStatus: "valid" | "invalid";
};

export type EnabledPaymentProvider = PublicPaymentProvider & {
  configJson: string;
  isEnabled: boolean;
};

export function validatePaymentProviderConfig(provider: PaymentProviderKind, configJson: string) {
  return parseProviderConfig(provider, configJson);
}

/** Whether a configured provider can charge an order in `currency`. */
export function providerSupportsCurrency(definition: ProviderDefinition, config: Record<string, unknown>, currency: CurrencyCode) {
  return providerAllowsSettleCurrency(definition.provider, config, currency);
}

export async function getEnabledPaymentProviders(database: D1Database): Promise<PublicPaymentProvider[]> {
  const db = createDrizzleDb(database);
  const records = await db
    .select({ provider: paymentProvider.provider, name: paymentProvider.name, configJson: paymentProvider.configJson })
    .from(paymentProvider)
    .where(eq(paymentProvider.isEnabled, true))
    .orderBy(asc(paymentProvider.sort), asc(paymentProvider.id));

  return records.flatMap((record) => {
    try {
      const definition = getProviderDefinition(record.provider);
      if (!definition) return [];
      const config = parseProviderConfig(record.provider, record.configJson);
      const currencies = providerSettleCurrencies(record.provider as PaymentProviderKind, config as unknown as Record<string, unknown>);
      return [{
        provider: record.provider as PaymentProviderKind,
        name: record.name,
        channels: definition.getChannels(config),
        currency: currencies[0]!,
        currencies,
        configStatus: "valid" as const,
      }];
    } catch {
      return [];
    }
  });
}

export async function getPaymentProvider(database: D1Database, provider: PaymentProviderKind): Promise<EnabledPaymentProvider | null> {
  const db = createDrizzleDb(database);
  const [record] = await db
    .select({ provider: paymentProvider.provider, name: paymentProvider.name, isEnabled: paymentProvider.isEnabled, configJson: paymentProvider.configJson })
    .from(paymentProvider)
    .where(eq(paymentProvider.provider, provider))
    .limit(1);
  if (!record) return null;
  const definition = getProviderDefinition(record.provider);
  if (!definition) return null;
  try {
    const config = parseProviderConfig(record.provider, record.configJson);
    const currencies = providerSettleCurrencies(record.provider as PaymentProviderKind, config as unknown as Record<string, unknown>);
    return {
      provider: record.provider as PaymentProviderKind,
      name: record.name,
      channels: definition.getChannels(config),
      currency: currencies[0]!,
      currencies,
      configStatus: "valid",
      configJson: record.configJson,
      isEnabled: record.isEnabled,
    };
  } catch {
    return {
      provider: record.provider as PaymentProviderKind,
      name: record.name,
      channels: [],
      currency: "CNY",
      currencies: ["CNY"],
      configStatus: "invalid",
      configJson: record.configJson,
      isEnabled: record.isEnabled,
    };
  }
}

export async function getEnabledPaymentProvider(database: D1Database, provider: PaymentProviderKind, currency?: CurrencyCode) {
  const record = await getPaymentProvider(database, provider);
  if (!record?.isEnabled || record.configStatus !== "valid") return null;
  if (currency && !record.currencies.includes(currency)) return null;
  return record;
}

export function requirePaymentChannel(provider: PaymentProviderKind, configJson: string, channel: string | undefined) {
  const definition = getProviderDefinition(provider);
  if (!definition) appError("PAYMENT_PROVIDER_NOT_IMPLEMENTED");
  const config = parseProviderConfig(provider, configJson);
  const selected = channel || definition.getChannels(config)[0];
  if (selected && !definition.getChannels(config).includes(selected as PaymentChannel)) appError("PAYMENT_CHANNEL_INVALID");
  return selected as PaymentChannel | undefined;
}

export { providerSettleCurrency, providerSettleCurrencies, providerAllowsSettleCurrency };
