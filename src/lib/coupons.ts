export type CouponDiscountType = "percent" | "fixed";

export type CouponFailureReason =
  | "invalid_code"
  | "scheduled"
  | "expired"
  | "min_cart"
  | "exhausted"
  | "archived";

export type CouponRule = {
  code?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minCartAmount: number;
  validFrom: Date | string | null;
  validTo: Date | string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  active: boolean;
  archived: boolean;
};

export type CouponEvaluation =
  | { ok: true; discountMajor: number; payableMajor: number }
  | { ok: false; reason: CouponFailureReason };

const CODE_PATTERN = /^[A-Z0-9]{3,24}$/;

export function normalizeCouponCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function isCouponCode(value: string) {
  return CODE_PATTERN.test(value);
}

export function generateCouponCode(length = 8) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

export function isCouponDiscountType(value: string): value is CouponDiscountType {
  return value === "percent" || value === "fixed";
}

function asDate(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isCouponScheduled(
  validFrom: Date | string | null | undefined,
  now = new Date(),
) {
  const date = asDate(validFrom);
  if (!date) return false;
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return now.getTime() < start.getTime();
}

export function isCouponExpired(
  validTo: Date | string | null | undefined,
  now = new Date(),
) {
  const date = asDate(validTo);
  if (!date) return false;
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return now.getTime() > end.getTime();
}

export function computeCouponDiscount(
  coupon: Pick<CouponRule, "discountType" | "discountValue" | "maxDiscountAmount">,
  cartSubtotalMajor: number,
) {
  const subtotal = Math.max(0, Math.round(cartSubtotalMajor));
  if (coupon.discountType === "percent") {
    let discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount != null) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
    return Math.max(0, Math.min(discount, subtotal));
  }
  return Math.max(0, Math.min(Math.round(coupon.discountValue), subtotal));
}

export function evaluateCoupon({
  coupon,
  cartSubtotalMajor,
  now = new Date(),
}: {
  coupon: CouponRule | null | undefined;
  cartSubtotalMajor: number;
  now?: Date;
}): CouponEvaluation {
  if (!coupon) return { ok: false, reason: "invalid_code" };
  if (coupon.archived || !coupon.active) return { ok: false, reason: "archived" };
  if (isCouponScheduled(coupon.validFrom, now)) return { ok: false, reason: "scheduled" };
  if (isCouponExpired(coupon.validTo, now)) return { ok: false, reason: "expired" };
  if (coupon.maxRedemptions != null && coupon.redemptionCount >= coupon.maxRedemptions) {
    return { ok: false, reason: "exhausted" };
  }

  const subtotal = Math.max(0, Math.round(cartSubtotalMajor));
  if (coupon.minCartAmount > 0 && subtotal < coupon.minCartAmount) {
    return { ok: false, reason: "min_cart" };
  }

  const discountMajor = computeCouponDiscount(coupon, subtotal);
  return { ok: true, discountMajor, payableMajor: Math.max(0, subtotal - discountMajor) };
}

export const COUPON_FAILURE_COPY: Record<CouponFailureReason, string> = {
  invalid_code: "This code is not valid.",
  scheduled: "This coupon is not active yet.",
  expired: "This coupon has expired.",
  min_cart: "Cart total is below the minimum for this coupon.",
  exhausted: "This coupon has reached its redemption limit.",
  archived: "This coupon is archived.",
};
