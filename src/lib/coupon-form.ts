import type { CouponDiscountType } from "./coupons";
import { isCouponDiscountType, normalizeCouponCode } from "./coupons";

export type CouponFormValues = {
  id?: string;
  name: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minCartAmount: number;
  validFrom: string;
  validTo: string;
  maxRedemptions: number | null;
  maxPerPatient: number;
  previewCartAmount: number;
};

export function emptyCouponForm(): CouponFormValues {
  return {
    name: "",
    code: "",
    description: "",
    discountType: "percent",
    discountValue: 10,
    maxDiscountAmount: null,
    minCartAmount: 0,
    validFrom: "",
    validTo: "",
    maxRedemptions: null,
    maxPerPatient: 1,
    previewCartAmount: 500,
  };
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function couponToFormValues(coupon: {
  id: string;
  name: string;
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minCartAmount: number;
  validFrom: Date | null;
  validTo: Date | null;
  maxRedemptions: number | null;
  maxPerPatient: number;
}): CouponFormValues {
  return {
    id: coupon.id,
    name: coupon.name,
    code: coupon.code,
    description: coupon.description,
    discountType: isCouponDiscountType(coupon.discountType) ? coupon.discountType : "percent",
    discountValue: coupon.discountValue,
    maxDiscountAmount: coupon.maxDiscountAmount,
    minCartAmount: coupon.minCartAmount,
    validFrom: toDateInput(coupon.validFrom),
    validTo: toDateInput(coupon.validTo),
    maxRedemptions: coupon.maxRedemptions,
    maxPerPatient: coupon.maxPerPatient,
    previewCartAmount: Math.max(coupon.minCartAmount || 500, 500),
  };
}

export function parseOptionalPositiveInt(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(1, Math.trunc(n));
}

export function validateCouponForm(values: CouponFormValues): string | null {
  if (values.name.trim().length < 2) return "Name is required.";
  const code = normalizeCouponCode(values.code);
  if (code.length < 3) return "Code must be 3–24 letters or numbers.";
  if (values.discountType === "percent" && (values.discountValue < 1 || values.discountValue > 100)) {
    return "Percent discount must be between 1 and 100.";
  }
  if (values.discountType === "fixed" && values.discountValue < 1) {
    return "Fixed discount must be at least 1.";
  }
  if (values.maxDiscountAmount != null && values.maxDiscountAmount < 1) {
    return "Max discount must be at least 1 when set.";
  }
  if (values.minCartAmount < 0) return "Minimum cart amount cannot be negative.";
  if (values.validFrom && values.validTo && values.validTo < values.validFrom) {
    return "Valid to cannot be before valid from.";
  }
  if (values.maxRedemptions != null && values.maxRedemptions < 1) {
    return "Max redemptions must be at least 1 when set.";
  }
  if (values.maxPerPatient < 1) return "Per-patient max must be at least 1.";
  return null;
}
