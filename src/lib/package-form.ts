import type { DiscountType } from "@/lib/catalog";
import type { GenderRestriction } from "@/lib/lab-master";
import {
  fulfillmentFeeFlags,
  isFulfillmentMode,
  type FulfillmentMode,
} from "@/lib/package-fulfillment";
import { isHexColor, isPackageThemeId, type PackageThemeId } from "@/lib/package-themes";

export type PackageFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  highlights: string;
  visibility: "public" | "private" | "restricted";
  fulfillmentMode: FulfillmentMode;
  validFrom: string;
  validTo: string;
  listPrice: number;
  discountType: DiscountType;
  discountValue: number;
  eligibilityNotes: string;
  terms: string;
  cancellationPolicy: string;
  prepInstructions: string;
  fastingHours: number | null;
  genderRestriction: GenderRestriction;
  minAge: number | null;
  maxAge: number | null;
  homeCollectionAllowed: boolean;
  homeCollectionFee: number;
  shippingFee: number;
  consultationFee: number;
  bannerImageUrl: string;
  theme: PackageThemeId;
  customAccentHex: string;
  active: boolean;
  masterTestIds: string[];
};

export function emptyPackageForm(): PackageFormValues {
  return {
    name: "",
    slug: "",
    description: "",
    category: "",
    tags: "",
    highlights: "",
    visibility: "public",
    fulfillmentMode: "self_registration",
    validFrom: "",
    validTo: "",
    listPrice: 0,
    discountType: "none",
    discountValue: 0,
    eligibilityNotes: "",
    terms: "",
    cancellationPolicy: "",
    prepInstructions: "",
    fastingHours: null,
    genderRestriction: "any",
    minAge: null,
    maxAge: null,
    homeCollectionAllowed: false,
    homeCollectionFee: 0,
    shippingFee: 0,
    consultationFee: 0,
    bannerImageUrl: "",
    theme: "sage",
    customAccentHex: "#0F766E",
    active: true,
    masterTestIds: [],
  };
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function parseOptionalInt(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function packageToFormValues(pkg: {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string;
  highlights: string;
  visibility: string;
  fulfillmentMode?: string;
  validFrom: Date | null;
  validTo: Date | null;
  listPrice: number;
  discountType: string;
  discountValue: number;
  eligibilityNotes: string;
  terms: string;
  cancellationPolicy: string;
  prepInstructions: string;
  fastingHours: number | null;
  genderRestriction: string;
  minAge: number | null;
  maxAge: number | null;
  homeCollectionAllowed: boolean;
  homeCollectionFee: number;
  shippingFee: number;
  consultationFee: number;
  bannerImageUrl: string;
  theme: string;
  customAccentHex?: string;
  active: boolean;
  masterTestIds: string[];
}): PackageFormValues {
  const description = pkg.description.trim() || pkg.highlights.trim();
  const rawFulfillment = pkg.fulfillmentMode ?? "";
  const fulfillmentMode: FulfillmentMode = isFulfillmentMode(rawFulfillment)
    ? rawFulfillment
    : pkg.homeCollectionAllowed
      ? "home_collection"
      : "self_registration";

  return {
    id: pkg.id,
    name: pkg.name,
    slug: pkg.slug,
    description,
    category: pkg.category,
    tags: pkg.tags,
    highlights: "",
    visibility: (pkg.visibility as PackageFormValues["visibility"]) ?? "public",
    fulfillmentMode,
    validFrom: toDateInput(pkg.validFrom),
    validTo: toDateInput(pkg.validTo),
    listPrice: pkg.listPrice,
    discountType: (pkg.discountType as DiscountType) ?? "none",
    discountValue: pkg.discountValue,
    eligibilityNotes: pkg.eligibilityNotes,
    terms: pkg.terms,
    cancellationPolicy: pkg.cancellationPolicy,
    prepInstructions: pkg.prepInstructions,
    fastingHours: pkg.fastingHours,
    genderRestriction: (pkg.genderRestriction as GenderRestriction) ?? "any",
    minAge: pkg.minAge,
    maxAge: pkg.maxAge,
    homeCollectionAllowed: fulfillmentFeeFlags(fulfillmentMode).homeCollection,
    homeCollectionFee: pkg.homeCollectionFee,
    shippingFee: pkg.shippingFee,
    consultationFee: pkg.consultationFee,
    bannerImageUrl: pkg.bannerImageUrl,
    theme: isPackageThemeId(pkg.theme) ? pkg.theme : "sage",
    customAccentHex: pkg.customAccentHex?.trim() || "#0F766E",
    active: pkg.active,
    masterTestIds: pkg.masterTestIds,
  };
}

export function validatePackageStep(
  step: number,
  values: PackageFormValues,
  listPrice: number,
): string | null {
  if (step === 0) {
    if (values.name.trim().length < 2) return "Name is required.";
    return null;
  }
  if (step === 1) {
    if (values.masterTestIds.length < 1) return "Select at least one test.";
    if (values.discountType === "percent" && values.discountValue > 100) {
      return "Percent discount cannot exceed 100.";
    }
    if (values.discountType === "fixed" && values.discountValue > listPrice) {
      return "Fixed discount cannot exceed list price.";
    }
    return null;
  }
  if (step === 2) {
    if (values.validFrom && values.validTo && values.validTo < values.validFrom) {
      return "Valid to cannot be before valid from.";
    }
    if (values.minAge != null && values.maxAge != null && values.minAge > values.maxAge) {
      return "Min age cannot be greater than max age.";
    }
    if (values.fastingHours != null && values.fastingHours < 0) {
      return "Fasting hours cannot be negative.";
    }
    return null;
  }
  if (step === 3) {
    if (values.theme === "custom" && !isHexColor(values.customAccentHex)) {
      return "Enter a valid hex color for the custom theme.";
    }
    return null;
  }
  return null;
}
