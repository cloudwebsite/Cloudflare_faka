export type AdminPageMeta = {
  title: string;
  path: string;
  pageTitle: string;
  description: string;
};

export type AdminNavigationModule = AdminPageMeta & {
  items: readonly AdminPageMeta[];
};

export type AdminNavigationItem = AdminPageMeta | AdminNavigationModule;

export type AdminNavigationGroup = {
  title: string;
  items: readonly AdminNavigationItem[];
};

export function isNavigationModule(item: AdminNavigationItem): item is AdminNavigationModule {
  return "items" in item;
}

const emailDescription = "管理邮件 Provider 和发送统计。";

export const adminPages = {
  account: {
    title: "账户设置",
    path: "/account",
    pageTitle: "账户设置",
    description: "修改当前管理员的昵称、邮箱和登录密码。",
  },
  dashboard: {
    title: "面板",
    path: "/dash",
    pageTitle: "运营面板",
    description: "当前店铺的真实运营汇总。",
  },
  categories: {
    title: "分类管理",
    path: "/catalog/categories",
    pageTitle: "分类管理",
    description: "管理商品分类、图标、排序和启用状态。",
  },
  products: {
    title: "商品列表",
    path: "/catalog/products",
    pageTitle: "商品管理",
    description: "管理商品价格、分类、上下架状态和购买限制。",
  },
  productNew: {
    title: "添加商品",
    path: "/catalog/products/new",
    pageTitle: "添加商品",
    description: "完整配置商品信息、发货规则和发布状态。",
  },
  productEdit: {
    title: "编辑商品",
    path: "/catalog/products/:id",
    pageTitle: "编辑商品",
    description: "编辑商品信息、发货规则和发布状态。",
  },
  cards: {
    title: "卡密管理",
    path: "/catalog/cards",
    pageTitle: "卡密管理",
    description: "管理自动发货商品的卡密库存、批次与发售状态。",
  },
  discounts: {
    title: "优惠券管理",
    path: "/catalog/discounts",
    pageTitle: "优惠券管理",
    description: "创建优惠规则、限制使用次数和适用商品。",
  },
  banners: {
    title: "轮播管理",
    path: "/catalog/banners",
    pageTitle: "轮播管理",
    description: "管理前台首页轮播图、排序与跳转链接。",
  },
  contentNews: {
    title: "新闻资讯",
    path: "/content/news",
    pageTitle: "新闻资讯",
    description: "管理前台新闻公告，支持置顶与排序。",
  },
  contentNewsNew: {
    title: "添加新闻",
    path: "/content/news/new",
    pageTitle: "添加新闻",
    description: "创建新闻资讯文章。",
  },
  contentNewsEdit: {
    title: "编辑新闻",
    path: "/content/news/:id",
    pageTitle: "编辑新闻",
    description: "编辑新闻资讯文章。",
  },
  contentHelp: {
    title: "帮助文章",
    path: "/content/help",
    pageTitle: "帮助文章",
    description: "管理帮助中心文章，支持置顶与排序。",
  },
  contentHelpNew: {
    title: "添加帮助",
    path: "/content/help/new",
    pageTitle: "添加帮助",
    description: "创建帮助中心文章。",
  },
  contentHelpEdit: {
    title: "编辑帮助",
    path: "/content/help/:id",
    pageTitle: "编辑帮助",
    description: "编辑帮助中心文章。",
  },
  contentPages: {
    title: "固定单页",
    path: "/content/pages",
    pageTitle: "固定单页",
    description: "管理关于我们、用户协议等固定页面，支持置顶与排序后在页脚展示。",
  },
  contentPagesNew: {
    title: "添加单页",
    path: "/content/pages/new",
    pageTitle: "添加单页",
    description: "创建固定单页。",
  },
  contentPagesEdit: {
    title: "编辑单页",
    path: "/content/pages/:id",
    pageTitle: "编辑单页",
    description: "编辑固定单页。",
  },
  supplierAccounts: {
    title: "供应商账号",
    path: "/suppliers/accounts",
    pageTitle: "供应商账号",
    description: "管理 ACG 和独角数卡 Next 上游账号、余额与连接状态。",
  },
  supplierProducts: {
    title: "供应商商品",
    path: "/suppliers/products",
    pageTitle: "供应商商品",
    description: "查看上游商品、SKU、库存和成本，并同步已绑定货源。",
  },
  supplierOrders: {
    title: "供应商订单",
    path: "/suppliers/orders",
    pageTitle: "供应商订单",
    description: "查看采购状态、成本、错误并执行重试、对账和账号重选。",
  },
  orders: {
    title: "订单管理",
    path: "/orders",
    pageTitle: "订单管理",
    description: "查看订单、关闭未支付订单，并处理人工、物流及自动发货恢复。",
  },
  users: {
    title: "用户管理",
    path: "/users",
    pageTitle: "用户管理",
    description: "查看已注册用户的基础资料、验证状态与双因素认证状态。",
  },
  pushConfig: {
    title: "推送配置",
    path: "/push/config",
    pageTitle: "消息推送设置",
    description: "配置订单事件的推送对象和可用渠道。",
  },
  pushLogs: {
    title: "发送日志",
    path: "/push/history",
    pageTitle: "推送发送日志",
    description: "记录电子邮件、微信三方和 Telegram 等全部渠道的发送结果。",
  },
  email: {
    title: "电子邮件",
    path: "/push/email",
    pageTitle: "电子邮件",
    description: emailDescription,
  },
  mailPostOffice: {
    title: "通道配置",
    path: "/push/email/post-office",
    pageTitle: "邮件通道配置",
    description: "配置邮件 Provider，并发送测试邮件。",
  },
  mailTemplates: {
    title: "消息模板",
    path: "/push/templates",
    pageTitle: "消息模板",
    description: "管理各消息场景的标题、正文和可用变量。",
  },
  wecom: {
    title: "微信三方",
    path: "/push/wecom",
    pageTitle: "微信三方通知配置",
    description: "配置微信三方通知渠道。",
  },
  telegram: {
    title: "Telegram",
    path: "/push/telegram",
    pageTitle: "Telegram 通知配置",
    description: "配置 Telegram Bot 通知渠道。",
  },
  telegramSupport: {
    title: "客服机器人",
    path: "/push/telegram/support",
    pageTitle: "Telegram 客服机器人",
    description: "配置 Telegram 客服 Webhook、查单与人工转发。",
  },
  payments: {
    title: "支付配置",
    path: "/system/payments",
    pageTitle: "支付配置",
    description: "管理支付渠道和支付日志。",
  },
  paymentLogs: {
    title: "支付日志",
    path: "/system/payments/payment-logs",
    pageTitle: "支付日志",
    description: "查看已脱敏的支付事件与验证结果。",
  },
  media: {
    title: "媒体存储",
    path: "/system/media",
    pageTitle: "媒体存储配置",
    description: "配置 S3 兼容存储与保存在 D1 的访问凭据。",
  },
  settings: {
    title: "站点配置",
    path: "/system/settings",
    pageTitle: "站点配置",
    description: "管理公开商城、前台模板、站点资源和默认 SEO 配置。",
  },
  security: {
    title: "安全配置",
    path: "/system/security",
    pageTitle: "安全配置",
    description: "管理站点安全配置。",
  },

  tasks: {
    title: "定时任务",
    path: "/system/tasks",
    pageTitle: "定时任务",
    description: "由 Cloudflare Cron 自动执行，这里只记录 Cron 异常；系统最多保留最近 1,000 条异常记录。",
  },
} as const satisfies Record<string, AdminPageMeta>;

export const adminNavigation = {
  dashboard: adminPages.dashboard,
  product: {
    title: "商品管理",
    items: [adminPages.categories, adminPages.products, adminPages.cards, adminPages.discounts],
  },
  content: {
    title: "内容管理",
    items: [adminPages.contentNews, adminPages.contentHelp, adminPages.contentPages],
  },
  orders: adminPages.orders,
  suppliers: {
    title: "供应商管理",
    items: [adminPages.supplierAccounts, adminPages.supplierProducts, adminPages.supplierOrders],
  },
  users: adminPages.users,
  push: {
    title: "推送管理",
    items: [
      adminPages.pushConfig,
      adminPages.mailTemplates,
      { ...adminPages.email, items: [adminPages.mailPostOffice] },
      adminPages.wecom,
      adminPages.telegram,
      adminPages.telegramSupport,
      adminPages.pushLogs,
    ],
  },
  system: {
    title: "系统配置",
    items: [adminPages.payments, adminPages.media, adminPages.settings, adminPages.banners, adminPages.security, adminPages.tasks],
  },

} as const satisfies Record<string, AdminPageMeta | AdminNavigationGroup>;

const navigationGroups: readonly AdminNavigationGroup[] = [
  adminNavigation.product,
  adminNavigation.content,
  adminNavigation.suppliers,
  adminNavigation.push,
  adminNavigation.system,
];

const allAdminPages = Object.values(adminPages) as readonly AdminPageMeta[];

export function getAdminPageMeta(pathname: string, basePath: string) {
  const routePath = pathname.slice(basePath.length).replace(/\/$/, "") || "/";
  return allAdminPages.find((page) => page.path === routePath)
    ?? (routePath.startsWith("/catalog/products/") ? adminPages.productEdit : undefined)
    ?? (routePath.startsWith("/content/news/") ? adminPages.contentNewsEdit : undefined)
    ?? (routePath.startsWith("/content/help/") ? adminPages.contentHelpEdit : undefined)
    ?? (routePath.startsWith("/content/pages/") ? adminPages.contentPagesEdit : undefined);
}

export function isAdminNavigationItemActive(pathname: string, basePath: string, item: AdminNavigationItem) {
  const target = `${basePath}${item.path}`;
  return pathname === target || pathname.startsWith(`${target}/`);
}

export function getAdminBreadcrumb(pathname: string, basePath: string) {
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (!isAdminNavigationItemActive(pathname, basePath, item)) continue;
      if (isNavigationModule(item)) {
        const child = item.items.find((candidate) => isAdminNavigationItemActive(pathname, basePath, candidate));
        return { titles: child ? [group.title, item.title, child.title] : [group.title, item.title] };
      }
      return { titles: [group.title, item.title] };
    }
  }

  const standaloneItems = [adminNavigation.dashboard, adminNavigation.orders, adminNavigation.users, adminPages.account];
  const standalone = standaloneItems.find((item) => isAdminNavigationItemActive(pathname, basePath, item));
  if (standalone) return { titles: [standalone.title] };

  const page = getAdminPageMeta(pathname, basePath);
  return { titles: [page?.title ?? "管理后台"] };
}
