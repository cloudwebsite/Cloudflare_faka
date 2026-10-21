export type SupportCustomLink = {
  label: string;
  href: string;
};

export type SupportChannel =
  | { type: "qq"; account: string; href: string }
  | { type: "telegram"; account: string; href: string }
  | { type: "wechat"; account: string | null; qrUrl: string | null; href: string }
  | { type: "email"; address: string; href: string }
  | { type: "link"; label: string; href: string };

export type SupportContactFields = {
  supportQq?: string | null;
  supportTelegram?: string | null;
  supportWechat?: string | null;
  supportWechatQr?: string | null;
  supportEmail?: string | null;
  supportCustomLinks?: string | null;
  supportContact?: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeTelegramUsername(value: string) {
  return value.trim().replace(/^@+/, "");
}

export function parseLabelHrefLines(text: string | null | undefined): SupportCustomLink[] {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf("|");
      const label = separatorIndex >= 0 ? line.slice(0, separatorIndex).trim() : line;
      const address = separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : line;
      if (!label || !address) return null;
      const href = address.includes(":") ? address : EMAIL_RE.test(address) ? `mailto:${address}` : address;
      return { label, href };
    })
    .filter((item): item is SupportCustomLink => item !== null);
}

export function serializeCustomLinks(links: SupportCustomLink[]) {
  return links.map((link) => `${link.label}|${link.href}`).join("\n") || null;
}

export function hasStructuredSupport(fields: SupportContactFields) {
  return Boolean(
    fields.supportQq?.trim()
    || fields.supportTelegram?.trim()
    || fields.supportWechat?.trim()
    || fields.supportWechatQr?.trim()
    || fields.supportEmail?.trim()
    || fields.supportCustomLinks?.trim(),
  );
}

export function buildSupportContactSummary(fields: SupportContactFields) {
  const lines: string[] = [];
  const qq = fields.supportQq?.trim();
  if (qq) lines.push(`QQ 客服|https://wpa.qq.com/msgrd?v=3&uin=${encodeURIComponent(qq)}&site=qq&menu=yes`);

  const telegram = fields.supportTelegram ? normalizeTelegramUsername(fields.supportTelegram) : "";
  if (telegram) lines.push(`Telegram 客服|https://t.me/${encodeURIComponent(telegram)}`);

  const wechat = fields.supportWechat?.trim();
  if (wechat) lines.push(`微信客服|${wechat}`);

  const email = fields.supportEmail?.trim();
  if (email) lines.push(`邮箱客服|mailto:${email}`);

  for (const link of parseLabelHrefLines(fields.supportCustomLinks)) {
    lines.push(`${link.label}|${link.href}`);
  }

  return lines.length ? lines.join("\n") : null;
}

export function resolveSupportChannels(fields: SupportContactFields): SupportChannel[] {
  if (hasStructuredSupport(fields)) {
    const channels: SupportChannel[] = [];
    const qq = fields.supportQq?.trim();
    if (qq) {
      channels.push({
        type: "qq",
        account: qq,
        href: `https://wpa.qq.com/msgrd?v=3&uin=${encodeURIComponent(qq)}&site=qq&menu=yes`,
      });
    }

    const telegram = fields.supportTelegram ? normalizeTelegramUsername(fields.supportTelegram) : "";
    if (telegram) {
      channels.push({
        type: "telegram",
        account: telegram,
        href: `https://t.me/${telegram}`,
      });
    }

    const wechat = fields.supportWechat?.trim() || null;
    const wechatQr = fields.supportWechatQr?.trim() || null;
    if (wechat || wechatQr) {
      channels.push({
        type: "wechat",
        account: wechat,
        qrUrl: wechatQr,
        href: "weixin://",
      });
    }

    const email = fields.supportEmail?.trim();
    if (email) {
      channels.push({
        type: "email",
        address: email,
        href: `mailto:${email}`,
      });
    }

    for (const link of parseLabelHrefLines(fields.supportCustomLinks)) {
      channels.push({ type: "link", label: link.label, href: link.href });
    }

    return channels;
  }

  return parseLabelHrefLines(fields.supportContact).map((link) => ({
    type: "link" as const,
    label: link.label,
    href: link.href,
  }));
}
