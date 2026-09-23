import type { StorefrontLayoutMeta, StorefrontSkinMeta } from "./types";
import { STOREFRONT_LAYOUT_IDS, STOREFRONT_SKIN_IDS, type StorefrontLayoutId, type StorefrontSkinId } from "./types";

export const DEFAULT_STOREFRONT_LAYOUT: StorefrontLayoutId = "classic";
export const DEFAULT_STOREFRONT_SKIN: StorefrontSkinId = "default";

export const STOREFRONT_LAYOUTS: StorefrontLayoutMeta[] = [
  { id: "classic", name: "经典商城", description: "顶栏 + 公告搜索 + 分类芯片 + 四列卡片" },
  { id: "marketplace", name: "集市密集", description: "紧凑顶栏、吸顶分类、密集商品卡" },
  { id: "magazine", name: "杂志 Hero", description: "大图 Hero + 精选大卡 + 列表式商品" },
  { id: "sidebar", name: "侧栏目录", description: "左侧分类栏 + 右侧商品网格" },
  { id: "lanyao", name: "分区商城", description: "分类轨 + Banner + 一级分类墙 + 默认列表/宫格切换" },
  { id: "quickcard", name: "快卡选购", description: "单页纵向：公告 → 选分类 → 选商品 → 详情介绍 → 同页下单" },
  { id: "duocai", name: "展柜商城", description: "蓝顶栏 + Banner公告 + 图标分类 + 筛选宫格卡" },
  { id: "fashion", name: "卡片列表", description: "白顶栏侧栏导航 + 封面商品卡网格" },
  { id: "wholesale", name: "批发目录", description: "商家公告栏 + 密集商品表 + 点击标题展开介绍" },
];

export const STOREFRONT_SKINS: StorefrontSkinMeta[] = [
  { id: "default", name: "默认", description: "中性配色，适配全部布局", swatch: "#171717" },
  { id: "ocean", name: "海洋", description: "冷色青蓝主色", swatch: "#0e7490" },
  { id: "ember", name: "燃橙", description: "暖橙强调价签与按钮", swatch: "#ea580c" },
  { id: "slate", name: "岩灰", description: "高对比中性灰", swatch: "#475569" },
  { id: "forest", name: "松绿", description: "清新绿色主色，适合分区/展柜", swatch: "#15803d" },
  { id: "rose", name: "蔷薇", description: "暖玫红主色", swatch: "#e11d48" },
  { id: "sky", name: "晴空", description: "亮蓝主色，贴近快卡/展柜", swatch: "#2563eb" },
  { id: "amber", name: "琥珀", description: "金黄主色与暖价签", swatch: "#d97706" },
  { id: "grape", name: "葡萄", description: "紫调主色，偏时尚卡片", swatch: "#7c3aed" },
];

export function isStorefrontLayoutId(value: unknown): value is StorefrontLayoutId {
  return typeof value === "string" && (STOREFRONT_LAYOUT_IDS as readonly string[]).includes(value);
}

export function isStorefrontSkinId(value: unknown): value is StorefrontSkinId {
  return typeof value === "string" && (STOREFRONT_SKIN_IDS as readonly string[]).includes(value);
}

export function normalizeStorefrontLayout(value: unknown): StorefrontLayoutId {
  return isStorefrontLayoutId(value) ? value : DEFAULT_STOREFRONT_LAYOUT;
}

export function normalizeStorefrontSkin(value: unknown): StorefrontSkinId {
  return isStorefrontSkinId(value) ? value : DEFAULT_STOREFRONT_SKIN;
}
