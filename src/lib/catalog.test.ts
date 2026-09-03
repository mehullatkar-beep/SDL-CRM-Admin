import { describe, expect, it } from "vitest";
import { computeOfferPrice, formatMoney, slugify } from "./catalog";
import { fulfillmentFeeFlags } from "./package-fulfillment";
import { copyPackageName, isPackageExpired, packageListStatus } from "./package-lifecycle";

describe("catalog domain rules", () => {
  it("creates stable URL slugs", () => {
    expect(slugify("  Full Body Check-up  ")).toBe("full-body-check-up");
  });

  it("computes percentage and fixed discounts without negative prices", () => {
    expect(computeOfferPrice(1000, "percent", 20)).toBe(800);
    expect(computeOfferPrice(1000, "fixed", 250)).toBe(750);
    expect(computeOfferPrice(100, "fixed", 200)).toBe(0);
  });

  it("formats catalog prices using the configured Saudi currency", () => {
    expect(formatMoney(1250)).toContain("1,250");
  });

  it("classifies archived packages before expiry", () => {
    const now = new Date("2026-09-02T12:00:00Z");
    expect(packageListStatus({ archived: true, validTo: "2020-01-01" }, now)).toBe("archived");
    expect(packageListStatus({ validTo: "2026-09-01" }, now)).toBe("expired");
    expect(isPackageExpired("2026-09-02", now)).toBe(false);
  });

  it("normalizes copied names and fulfillment fees", () => {
    expect(copyPackageName("Wellness (copy 3)")).toBe("Wellness (copy)");
    expect(fulfillmentFeeFlags("appointment_home_collection")).toEqual({
      homeCollection: true,
      consultation: true,
      shipping: false,
    });
  });
});
