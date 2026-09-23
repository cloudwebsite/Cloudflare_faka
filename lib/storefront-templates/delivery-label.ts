import type { StorefrontHomeProduct } from "./home-types";

export function deliveryTypeLabel(deliveryType: StorefrontHomeProduct["deliveryType"]): string {
  switch (deliveryType) {
    case "CARD_AUTO":
      return "自动发货";
    case "FIXED_CARD":
      return "固定卡密";
    case "MANUAL":
      return "人工发货";
    case "EXPRESS":
      return "物流发货";
    case "SUPPLIER":
      return "供货发货";
    default:
      return "";
  }
}

/** Approximate fulfillment speed label for shop-style product cards. */
export function deliverySpeedLabel(deliveryType: StorefrontHomeProduct["deliveryType"]): string {
  switch (deliveryType) {
    case "CARD_AUTO":
    case "FIXED_CARD":
      return "即时";
    case "EXPRESS":
      return "物流配送";
    case "MANUAL":
    case "SUPPLIER":
      return "人工处理";
    default:
      return "";
  }
}
