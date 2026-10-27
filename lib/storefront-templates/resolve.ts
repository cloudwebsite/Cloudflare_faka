import type { Component } from "vue";
import { normalizeStorefrontLayout } from "./registry";
import type { StorefrontLayoutId, StorefrontViewName } from "./types";

import ClassicHomeView from "@/components/storefront/layouts/classic/HomeView.vue";
import ClassicProductView from "@/components/storefront/layouts/classic/ProductView.vue";
import ClassicCheckoutView from "@/components/storefront/layouts/classic/CheckoutView.vue";
import ClassicAuthShell from "@/components/storefront/layouts/classic/AuthShell.vue";
import ClassicAccountShell from "@/components/storefront/layouts/classic/AccountShell.vue";
import ClassicOrderLookupView from "@/components/storefront/layouts/classic/OrderLookupView.vue";
import ClassicPaymentResultView from "@/components/storefront/layouts/classic/PaymentResultView.vue";

import MarketplaceHomeView from "@/components/storefront/layouts/marketplace/HomeView.vue";
import MarketplaceProductView from "@/components/storefront/layouts/marketplace/ProductView.vue";
import MarketplaceCheckoutView from "@/components/storefront/layouts/marketplace/CheckoutView.vue";
import MarketplaceAuthShell from "@/components/storefront/layouts/marketplace/AuthShell.vue";
import MarketplaceAccountShell from "@/components/storefront/layouts/marketplace/AccountShell.vue";
import MarketplaceOrderLookupView from "@/components/storefront/layouts/marketplace/OrderLookupView.vue";
import MarketplacePaymentResultView from "@/components/storefront/layouts/marketplace/PaymentResultView.vue";

import MagazineHomeView from "@/components/storefront/layouts/magazine/HomeView.vue";
import MagazineProductView from "@/components/storefront/layouts/magazine/ProductView.vue";
import MagazineCheckoutView from "@/components/storefront/layouts/magazine/CheckoutView.vue";
import MagazineAuthShell from "@/components/storefront/layouts/magazine/AuthShell.vue";
import MagazineAccountShell from "@/components/storefront/layouts/magazine/AccountShell.vue";
import MagazineOrderLookupView from "@/components/storefront/layouts/magazine/OrderLookupView.vue";
import MagazinePaymentResultView from "@/components/storefront/layouts/magazine/PaymentResultView.vue";

import SidebarHomeView from "@/components/storefront/layouts/sidebar/HomeView.vue";
import SidebarProductView from "@/components/storefront/layouts/sidebar/ProductView.vue";
import SidebarCheckoutView from "@/components/storefront/layouts/sidebar/CheckoutView.vue";
import SidebarAuthShell from "@/components/storefront/layouts/sidebar/AuthShell.vue";
import SidebarAccountShell from "@/components/storefront/layouts/sidebar/AccountShell.vue";
import SidebarOrderLookupView from "@/components/storefront/layouts/sidebar/OrderLookupView.vue";
import SidebarPaymentResultView from "@/components/storefront/layouts/sidebar/PaymentResultView.vue";

import LanyaoHomeView from "@/components/storefront/layouts/lanyao/HomeView.vue";
import LanyaoProductView from "@/components/storefront/layouts/lanyao/ProductView.vue";
import LanyaoCheckoutView from "@/components/storefront/layouts/lanyao/CheckoutView.vue";
import LanyaoAuthShell from "@/components/storefront/layouts/lanyao/AuthShell.vue";
import LanyaoAccountShell from "@/components/storefront/layouts/lanyao/AccountShell.vue";
import LanyaoOrderLookupView from "@/components/storefront/layouts/lanyao/OrderLookupView.vue";
import LanyaoPaymentResultView from "@/components/storefront/layouts/lanyao/PaymentResultView.vue";

import QuickcardHomeView from "@/components/storefront/layouts/quickcard/HomeView.vue";
import QuickcardProductView from "@/components/storefront/layouts/quickcard/ProductView.vue";
import QuickcardCheckoutView from "@/components/storefront/layouts/quickcard/CheckoutView.vue";
import QuickcardAuthShell from "@/components/storefront/layouts/quickcard/AuthShell.vue";
import QuickcardAccountShell from "@/components/storefront/layouts/quickcard/AccountShell.vue";
import QuickcardOrderLookupView from "@/components/storefront/layouts/quickcard/OrderLookupView.vue";
import QuickcardPaymentResultView from "@/components/storefront/layouts/quickcard/PaymentResultView.vue";

import DuocaiHomeView from "@/components/storefront/layouts/duocai/HomeView.vue";
import DuocaiProductView from "@/components/storefront/layouts/duocai/ProductView.vue";
import DuocaiCheckoutView from "@/components/storefront/layouts/duocai/CheckoutView.vue";
import DuocaiAuthShell from "@/components/storefront/layouts/duocai/AuthShell.vue";
import DuocaiAccountShell from "@/components/storefront/layouts/duocai/AccountShell.vue";
import DuocaiOrderLookupView from "@/components/storefront/layouts/duocai/OrderLookupView.vue";
import DuocaiPaymentResultView from "@/components/storefront/layouts/duocai/PaymentResultView.vue";

import FashionHomeView from "@/components/storefront/layouts/fashion/HomeView.vue";
import FashionProductView from "@/components/storefront/layouts/fashion/ProductView.vue";
import FashionCheckoutView from "@/components/storefront/layouts/fashion/CheckoutView.vue";
import FashionAuthShell from "@/components/storefront/layouts/fashion/AuthShell.vue";
import FashionAccountShell from "@/components/storefront/layouts/fashion/AccountShell.vue";
import FashionOrderLookupView from "@/components/storefront/layouts/fashion/OrderLookupView.vue";
import FashionPaymentResultView from "@/components/storefront/layouts/fashion/PaymentResultView.vue";

import WholesaleHomeView from "@/components/storefront/layouts/wholesale/HomeView.vue";
import WholesaleProductView from "@/components/storefront/layouts/wholesale/ProductView.vue";
import WholesaleCheckoutView from "@/components/storefront/layouts/wholesale/CheckoutView.vue";
import WholesaleAuthShell from "@/components/storefront/layouts/wholesale/AuthShell.vue";
import WholesaleAccountShell from "@/components/storefront/layouts/wholesale/AccountShell.vue";
import WholesaleOrderLookupView from "@/components/storefront/layouts/wholesale/OrderLookupView.vue";
import WholesalePaymentResultView from "@/components/storefront/layouts/wholesale/PaymentResultView.vue";

type LayoutViews = Record<StorefrontViewName, Component>;

const layoutViews: Record<StorefrontLayoutId, LayoutViews> = {
  classic: {
    HomeView: ClassicHomeView,
    ProductView: ClassicProductView,
    CheckoutView: ClassicCheckoutView,
    AuthShell: ClassicAuthShell,
    AccountShell: ClassicAccountShell,
    OrderLookupView: ClassicOrderLookupView,
    PaymentResultView: ClassicPaymentResultView,
  },
  marketplace: {
    HomeView: MarketplaceHomeView,
    ProductView: MarketplaceProductView,
    CheckoutView: MarketplaceCheckoutView,
    AuthShell: MarketplaceAuthShell,
    AccountShell: MarketplaceAccountShell,
    OrderLookupView: MarketplaceOrderLookupView,
    PaymentResultView: MarketplacePaymentResultView,
  },
  magazine: {
    HomeView: MagazineHomeView,
    ProductView: MagazineProductView,
    CheckoutView: MagazineCheckoutView,
    AuthShell: MagazineAuthShell,
    AccountShell: MagazineAccountShell,
    OrderLookupView: MagazineOrderLookupView,
    PaymentResultView: MagazinePaymentResultView,
  },
  sidebar: {
    HomeView: SidebarHomeView,
    ProductView: SidebarProductView,
    CheckoutView: SidebarCheckoutView,
    AuthShell: SidebarAuthShell,
    AccountShell: SidebarAccountShell,
    OrderLookupView: SidebarOrderLookupView,
    PaymentResultView: SidebarPaymentResultView,
  },
  lanyao: {
    HomeView: LanyaoHomeView,
    ProductView: LanyaoProductView,
    CheckoutView: LanyaoCheckoutView,
    AuthShell: LanyaoAuthShell,
    AccountShell: LanyaoAccountShell,
    OrderLookupView: LanyaoOrderLookupView,
    PaymentResultView: LanyaoPaymentResultView,
  },
  quickcard: {
    HomeView: QuickcardHomeView,
    ProductView: QuickcardProductView,
    CheckoutView: QuickcardCheckoutView,
    AuthShell: QuickcardAuthShell,
    AccountShell: QuickcardAccountShell,
    OrderLookupView: QuickcardOrderLookupView,
    PaymentResultView: QuickcardPaymentResultView,
  },
  duocai: {
    HomeView: DuocaiHomeView,
    ProductView: DuocaiProductView,
    CheckoutView: DuocaiCheckoutView,
    AuthShell: DuocaiAuthShell,
    AccountShell: DuocaiAccountShell,
    OrderLookupView: DuocaiOrderLookupView,
    PaymentResultView: DuocaiPaymentResultView,
  },
  fashion: {
    HomeView: FashionHomeView,
    ProductView: FashionProductView,
    CheckoutView: FashionCheckoutView,
    AuthShell: FashionAuthShell,
    AccountShell: FashionAccountShell,
    OrderLookupView: FashionOrderLookupView,
    PaymentResultView: FashionPaymentResultView,
  },
  wholesale: {
    HomeView: WholesaleHomeView,
    ProductView: WholesaleProductView,
    CheckoutView: WholesaleCheckoutView,
    AuthShell: WholesaleAuthShell,
    AccountShell: WholesaleAccountShell,
    OrderLookupView: WholesaleOrderLookupView,
    PaymentResultView: WholesalePaymentResultView,
  },
};

export function resolveStorefrontView(view: StorefrontViewName, layoutId: unknown): Component {
  const layout = normalizeStorefrontLayout(layoutId);
  return layoutViews[layout][view] ?? layoutViews.classic[view];
}
