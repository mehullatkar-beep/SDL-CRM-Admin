export type StaffRole = "admin" | "crm";

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-SA", {
    style: "currency",
    currency: process.env.NEXT_PUBLIC_CATALOG_CURRENCY || "SAR",
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export type DiscountType = "none" | "percent" | "fixed";

export function computeOfferPrice(
  listPrice: number,
  discountType: DiscountType,
  discountValue: number,
) {
  if (discountType === "percent") {
    return Math.max(0, Math.round(listPrice * (1 - discountValue / 100)));
  }
  if (discountType === "fixed") {
    return Math.max(0, listPrice - discountValue);
  }
  return listPrice;
}
