export type BannerListStatus = "active" | "scheduled" | "expired" | "archived";

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isBannerScheduled(
  validFrom: Date | string | null | undefined,
  now = new Date(),
) {
  const date = asDate(validFrom);
  if (!date) return false;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return now.getTime() < start.getTime();
}

export function isBannerExpired(
  validTo: Date | string | null | undefined,
  now = new Date(),
) {
  const date = asDate(validTo);
  if (!date) return false;
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return now.getTime() > end.getTime();
}

export function bannerListStatus(
  banner: {
    archived?: boolean;
    validFrom?: Date | string | null;
    validTo?: Date | string | null;
  },
  now = new Date(),
): BannerListStatus {
  if (banner.archived) return "archived";
  if (isBannerExpired(banner.validTo, now)) return "expired";
  if (isBannerScheduled(banner.validFrom, now)) return "scheduled";
  return "active";
}

export function copyBannerName(name: string) {
  const trimmed = name.trim() || "Banner";
  const base = trimmed.replace(/\s*\(copy(?: \d+)?\)$/i, "").trim() || "Banner";
  return `${base} (copy)`;
}

export function bannerPlacementLabel(banner: {
  showOnHome: boolean;
  showInNotifications: boolean;
}) {
  if (banner.showOnHome && banner.showInNotifications) return "Home and inbox";
  if (banner.showOnHome) return "Home";
  if (banner.showInNotifications) return "Inbox";
  return "None";
}
