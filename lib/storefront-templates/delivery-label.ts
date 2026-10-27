import type { StorefrontHomeProduct } from "./home-types";

export type DeliveryTypeLabels = {
  cardAuto: string;
  fixedCard: string;
  manual: string;
  express: string;
  supplier: string;
};

export type DeliverySpeedLabels = {
  instant: string;
  shipping: string;
  manual: string;
};

export function deliveryTypeLabel(
  deliveryType: StorefrontHomeProduct["deliveryType"] | null | undefined,
  labels: DeliveryTypeLabels,
): string {
  switch (deliveryType) {
    case "CARD_AUTO":
      return labels.cardAuto;
    case "FIXED_CARD":
      return labels.fixedCard;
    case "MANUAL":
      return labels.manual;
    case "EXPRESS":
      return labels.express;
    case "SUPPLIER":
      return labels.supplier;
    default:
      return "";
  }
}

/** Approximate fulfillment speed label for shop-style product cards. */
export function deliverySpeedLabel(
  deliveryType: StorefrontHomeProduct["deliveryType"] | null | undefined,
  labels: DeliverySpeedLabels,
): string {
  switch (deliveryType) {
    case "CARD_AUTO":
    case "FIXED_CARD":
      return labels.instant;
    case "EXPRESS":
      return labels.shipping;
    case "MANUAL":
    case "SUPPLIER":
      return labels.manual;
    default:
      return "";
  }
}
