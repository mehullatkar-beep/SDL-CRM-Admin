import { describe, expect, it } from "vitest";
import { copyCouponName, couponListStatus, formatCouponUsage } from "./coupon-lifecycle";
import {
  computeCouponDiscount,
  evaluateCoupon,
  generateCouponCode,
  isCouponCode,
  normalizeCouponCode,
  type CouponRule,
} from "./coupons";

const now = new Date("2026-09-02T12:00:00Z");

function coupon(overrides: Partial<CouponRule> = {}): CouponRule {
  return {
    code: "WELCOME10",
    discountType: "percent",
    discountValue: 10,
    maxDiscountAmount: null,
    minCartAmount: 0,
    validFrom: null,
    validTo: null,
    maxRedemptions: null,
    redemptionCount: 0,
    active: true,
    archived: false,
    ...overrides,
  };
}

describe("coupon codes", () => {
  it("normalizes and validates codes", () => {
    expect(normalizeCouponCode(" welcome-10 ")).toBe("WELCOME10");
    expect(isCouponCode("WELCOME10")).toBe(true);
    expect(isCouponCode("ab")).toBe(false);
    expect(generateCouponCode(8)).toMatch(/^[A-Z0-9]{8}$/);
  });
});

describe("evaluateCoupon", () => {
  it("applies percent and fixed discounts without going below zero", () => {
    expect(computeCouponDiscount(coupon({ discountType: "percent", discountValue: 20 }), 1000)).toBe(
      200,
    );
    expect(evaluateCoupon({ coupon: coupon({ discountType: "percent", discountValue: 20 }), cartSubtotalMajor: 1000 }))
      .toEqual({ ok: true, discountMajor: 200, payableMajor: 800 });
    expect(
      evaluateCoupon({
        coupon: coupon({ discountType: "fixed", discountValue: 250 }),
        cartSubtotalMajor: 1000,
      }),
    ).toEqual({ ok: true, discountMajor: 250, payableMajor: 750 });
    expect(
      evaluateCoupon({
        coupon: coupon({ discountType: "fixed", discountValue: 200 }),
        cartSubtotalMajor: 100,
      }),
    ).toEqual({ ok: true, discountMajor: 100, payableMajor: 0 });
  });

  it("caps percent discounts", () => {
    expect(
      evaluateCoupon({
        coupon: coupon({ discountType: "percent", discountValue: 50, maxDiscountAmount: 80 }),
        cartSubtotalMajor: 1000,
      }),
    ).toEqual({ ok: true, discountMajor: 80, payableMajor: 920 });
  });

  it("rejects missing, archived, scheduled, expired, exhausted, and min-cart cases", () => {
    expect(evaluateCoupon({ coupon: null, cartSubtotalMajor: 500, now })).toEqual({
      ok: false,
      reason: "invalid_code",
    });
    expect(
      evaluateCoupon({ coupon: coupon({ archived: true }), cartSubtotalMajor: 500, now }),
    ).toEqual({ ok: false, reason: "archived" });
    expect(
      evaluateCoupon({ coupon: coupon({ active: false }), cartSubtotalMajor: 500, now }),
    ).toEqual({ ok: false, reason: "archived" });
    expect(
      evaluateCoupon({
        coupon: coupon({ validFrom: "2026-09-10" }),
        cartSubtotalMajor: 500,
        now,
      }),
    ).toEqual({ ok: false, reason: "scheduled" });
    expect(
      evaluateCoupon({
        coupon: coupon({ validTo: "2026-09-01" }),
        cartSubtotalMajor: 500,
        now,
      }),
    ).toEqual({ ok: false, reason: "expired" });
    expect(
      evaluateCoupon({
        coupon: coupon({ maxRedemptions: 10, redemptionCount: 10 }),
        cartSubtotalMajor: 500,
        now,
      }),
    ).toEqual({ ok: false, reason: "exhausted" });
    expect(
      evaluateCoupon({
        coupon: coupon({ minCartAmount: 400 }),
        cartSubtotalMajor: 200,
        now,
      }),
    ).toEqual({ ok: false, reason: "min_cart" });
  });
});

describe("coupon lifecycle", () => {
  it("classifies archived before expiry and scheduled before active", () => {
    expect(couponListStatus({ archived: true, validTo: "2020-01-01" }, now)).toBe("archived");
    expect(couponListStatus({ validTo: "2026-09-01" }, now)).toBe("expired");
    expect(couponListStatus({ validFrom: "2026-09-10" }, now)).toBe("scheduled");
    expect(couponListStatus({ validFrom: "2026-09-02", validTo: "2026-09-02" }, now)).toBe("active");
    expect(copyCouponName("Ramadan (copy 3)")).toBe("Ramadan (copy)");
    expect(formatCouponUsage(0, null)).toBe("0 / Unlimited");
    expect(formatCouponUsage(3, 10)).toBe("3 / 10");
  });
});
