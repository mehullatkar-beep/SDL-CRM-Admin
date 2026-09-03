import { isCouponExpired, isCouponScheduled } from "./coupons";

export type CouponListStatus = "active" | "scheduled" | "expired" | "archived";

export function couponListStatus(
  coupon: {
    archived?: boolean;
    validFrom?: Date | string | null;
    validTo?: Date | string | null;
  },
  now = new Date(),
): CouponListStatus {
  if (coupon.archived) return "archived";
  if (isCouponExpired(coupon.validTo, now)) return "expired";
  if (isCouponScheduled(coupon.validFrom, now)) return "scheduled";
  return "active";
}

export function copyCouponName(name: string) {
  const trimmed = name.trim() || "Coupon";
  const base = trimmed.replace(/\s*\(copy(?: \d+)?\)$/i, "").trim() || "Coupon";
  return `${base} (copy)`;
}

export function formatCouponUsage(redemptionCount: number, maxRedemptions: number | null) {
  if (maxRedemptions == null) return `${redemptionCount} / Unlimited`;
  return `${redemptionCount} / ${maxRedemptions}`;
}
