"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { packageCategories, packageTests, packages } from "@/db/schema";
import { computeOfferPrice, slugify, type DiscountType } from "@/lib/catalog";
import {
  copyPackageBannerFile,
  deletePackageBannerFile,
  isAllowedPackageBannerUrl,
  savePackageBannerFile,
} from "@/lib/package-banner";
import { copyPackageName } from "@/lib/package-lifecycle";
import { FULFILLMENT_MODES, fulfillmentFeeFlags } from "@/lib/package-fulfillment";
import { HEX_COLOR_PATTERN, PACKAGE_THEME_IDS } from "@/lib/package-themes";
import { requireAdmin } from "@/lib/session";
import { logError } from "@/lib/logger";

const fulfillmentIds = FULFILLMENT_MODES.map((mode) => mode.id) as [
  (typeof FULFILLMENT_MODES)[number]["id"],
  ...(typeof FULFILLMENT_MODES)[number]["id"][],
];

const packageSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, "Name is required."),
    slug: z.string().optional(),
    description: z.string(),
    category: z.string(),
    tags: z.string().optional(),
    visibility: z.enum(["public", "private", "restricted"]).optional(),
    fulfillmentMode: z.enum(fulfillmentIds),
    validFrom: z.string().nullable(),
    validTo: z.string().nullable(),
    listPrice: z.number().int().min(0),
    discountType: z.enum(["none", "percent", "fixed"]),
    discountValue: z.number().int().min(0),
    eligibilityNotes: z.string().optional(),
    terms: z.string(),
    cancellationPolicy: z.string(),
    prepInstructions: z.string(),
    homeCollectionFee: z.number().int().min(0),
    shippingFee: z.number().int().min(0),
    consultationFee: z.number().int().min(0),
    bannerImageUrl: z
      .string()
      .refine(isAllowedPackageBannerUrl, "Invalid banner image."),
    theme: z.enum(PACKAGE_THEME_IDS),
    customAccentHex: z.string(),
    highlights: z.string().optional(),
    fastingHours: z.number().int().min(0).nullable(),
    genderRestriction: z.enum(["any", "male", "female"]),
    minAge: z.number().int().min(0).nullable(),
    maxAge: z.number().int().min(0).nullable(),
    homeCollectionAllowed: z.boolean().optional(),
    active: z.boolean(),
    masterTestIds: z.array(z.string()).min(1, "Select at least one test."),
  })
  .superRefine((value, ctx) => {
    if (value.discountType === "percent" && value.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percent discount cannot exceed 100.",
        path: ["discountValue"],
      });
    }
    if (value.discountType === "fixed" && value.discountValue > value.listPrice) {
      ctx.addIssue({
        code: "custom",
        message: "Fixed discount cannot exceed list price.",
        path: ["discountValue"],
      });
    }
    if (value.validFrom && value.validTo && value.validTo < value.validFrom) {
      ctx.addIssue({
        code: "custom",
        message: "Valid to cannot be before valid from.",
        path: ["validTo"],
      });
    }
    if (value.minAge != null && value.maxAge != null && value.minAge > value.maxAge) {
      ctx.addIssue({
        code: "custom",
        message: "Min age cannot be greater than max age.",
        path: ["maxAge"],
      });
    }
    if (value.theme === "custom" && !HEX_COLOR_PATTERN.test(value.customAccentHex)) {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid hex color for the custom theme.",
        path: ["customAccentHex"],
      });
    }
  });

export type PackageInput = z.infer<typeof packageSchema>;

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function slugTaken(slug: string, excludeId?: string) {
  const db = await getDb();
  const [existing] = await db
    .select({ id: packages.id })
    .from(packages)
    .where(
      excludeId ? and(eq(packages.slug, slug), ne(packages.id, excludeId)) : eq(packages.slug, slug),
    )
    .limit(1);
  return Boolean(existing);
}

async function uniqueSlug(name: string, existingSlug?: string, excludeId?: string) {
  if (existingSlug && excludeId) {
    const kept = slugify(existingSlug);
    if (kept && !(await slugTaken(kept, excludeId))) return kept;
  }

  const base = slugify(name) || "package";
  let slug = base;
  let n = 2;
  while (await slugTaken(slug, excludeId)) {
    slug = `${base.slice(0, 70)}-${n}`;
    n += 1;
  }
  return slug;
}

export async function savePackage(input: PackageInput) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const parsed = packageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid package." };
  }

  const data = parsed.data;
  const slug = await uniqueSlug(data.name, data.slug, data.id);
  const fees = fulfillmentFeeFlags(data.fulfillmentMode);

  const offerPrice = computeOfferPrice(
    data.listPrice,
    data.discountType as DiscountType,
    data.discountValue,
  );

  const db = await getDb();
  const now = new Date();
  const id = data.id ?? crypto.randomUUID();
  const category = data.category.trim();

  if (category) {
    const [existingCategory] = await db
      .select({ id: packageCategories.id })
      .from(packageCategories)
      .where(eq(packageCategories.name, category))
      .limit(1);
    if (!existingCategory) {
      await db.insert(packageCategories).values({
        id: crypto.randomUUID(),
        name: category,
        createdAt: now,
      });
    }
  }

  const row = {
    name: data.name.trim(),
    slug,
    description: data.description.trim(),
    category,
    tags: "",
    visibility: "public" as const,
    fulfillmentMode: data.fulfillmentMode,
    validFrom: parseDate(data.validFrom),
    validTo: parseDate(data.validTo),
    listPrice: data.listPrice,
    discountType: data.discountType,
    discountValue: data.discountValue,
    offerPrice,
    eligibilityNotes: (data.eligibilityNotes ?? "").trim(),
    terms: data.terms.trim(),
    cancellationPolicy: data.cancellationPolicy.trim(),
    prepInstructions: data.prepInstructions.trim(),
    highlights: data.description.trim(),
    fastingHours: data.fastingHours,
    genderRestriction: data.genderRestriction,
    minAge: data.minAge,
    maxAge: data.maxAge,
    homeCollectionAllowed: fees.homeCollection,
    homeCollectionFee: fees.homeCollection ? data.homeCollectionFee : 0,
    shippingFee: fees.shipping ? data.shippingFee : 0,
    consultationFee: fees.consultation ? data.consultationFee : 0,
    bannerImageUrl: data.bannerImageUrl,
    theme: data.theme,
    customAccentHex: data.theme === "custom" ? data.customAccentHex : "",
    active: data.active,
    updatedAt: now,
  };

  if (data.id) {
    const [existing] = await db
      .select({ bannerImageUrl: packages.bannerImageUrl })
      .from(packages)
      .where(eq(packages.id, data.id))
      .limit(1);
    if (existing?.bannerImageUrl && existing.bannerImageUrl !== data.bannerImageUrl) {
      await deletePackageBannerFile(existing.bannerImageUrl);
    }
    await db.update(packages).set(row).where(eq(packages.id, data.id));
    await db.delete(packageTests).where(eq(packageTests.packageId, data.id));
  } else {
    await db.insert(packages).values({ id, createdAt: now, ...row });
  }

  if (data.masterTestIds.length > 0) {
    await db.insert(packageTests).values(
      data.masterTestIds.map((masterTestId, index) => ({
        id: crypto.randomUUID(),
        packageId: id,
        masterTestId,
        sortOrder: index,
      })),
    );
  }

  revalidatePath("/catalog/packages");
  revalidatePath(`/catalog/packages/${id}`);
  return { id, slug };
}

export async function createPackageCategory(name: string) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const trimmed = name.trim();
  if (trimmed.length < 2) return { error: "Category name is required." };

  const db = await getDb();
  const [existing] = await db
    .select({ name: packageCategories.name })
    .from(packageCategories)
    .where(eq(packageCategories.name, trimmed))
    .limit(1);
  if (existing) return { name: existing.name };

  await db.insert(packageCategories).values({
    id: crypto.randomUUID(),
    name: trimmed,
  });
  revalidatePath("/catalog/packages");
  return { name: trimmed };
}

export async function uploadPackageBanner(formData: FormData) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return { error: "Choose an image file." as const };
  }

  try {
    const result = await savePackageBannerFile(file);
    if ("error" in result) return { error: result.error };
    return { url: result.url };
  } catch (caught) {
    logError("packages.banner.upload_failed", caught);
    return { error: "Could not save the image. Try again." as const };
  }
}

export async function setPackageActive(id: string, active: boolean) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  await db
    .update(packages)
    .set({ active, updatedAt: new Date() })
    .where(eq(packages.id, id));

  revalidatePath("/catalog/packages");
  revalidatePath(`/catalog/packages/${id}`);
  return { success: true };
}

export async function setPackageArchived(id: string, archived: boolean) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  const [existing] = await db.select({ id: packages.id }).from(packages).where(eq(packages.id, id)).limit(1);
  if (!existing) return { error: "Package not found." };

  await db
    .update(packages)
    .set({
      archived,
      active: !archived,
      updatedAt: new Date(),
    })
    .where(eq(packages.id, id));

  revalidatePath("/catalog/packages");
  revalidatePath(`/catalog/packages/${id}`);
  return { success: true };
}

async function uniqueCopyName(name: string) {
  const db = await getDb();
  const proposed = copyPackageName(name);
  const [first] = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.name, proposed))
    .limit(1);
  if (!first) return proposed;

  const base = proposed.replace(/\s*\(copy\)$/i, "").trim() || "Package";
  let n = 2;
  while (n < 100) {
    const candidate = `${base} (copy ${n})`;
    const [existing] = await db
      .select({ id: packages.id })
      .from(packages)
      .where(eq(packages.name, candidate))
      .limit(1);
    if (!existing) return candidate;
    n += 1;
  }
  return `${base} (copy ${crypto.randomUUID().slice(0, 8)})`;
}

export async function duplicatePackage(id: string) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  const [pkg] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!pkg) return { error: "Package not found." };

  const items = await db
    .select()
    .from(packageTests)
    .where(eq(packageTests.packageId, id))
    .orderBy(asc(packageTests.sortOrder));

  const now = new Date();
  const newId = crypto.randomUUID();
  const name = await uniqueCopyName(pkg.name);
  const slug = await uniqueSlug(name);
  const bannerImageUrl = pkg.bannerImageUrl
    ? await copyPackageBannerFile(pkg.bannerImageUrl)
    : "";

  await db.insert(packages).values({
    id: newId,
    name,
    slug,
    description: pkg.description,
    category: pkg.category,
    tags: pkg.tags,
    visibility: pkg.visibility,
    fulfillmentMode: pkg.fulfillmentMode,
    customAccentHex: pkg.customAccentHex,
    validFrom: pkg.validFrom,
    validTo: pkg.validTo,
    listPrice: pkg.listPrice,
    discountType: pkg.discountType,
    discountValue: pkg.discountValue,
    offerPrice: pkg.offerPrice,
    eligibilityNotes: pkg.eligibilityNotes,
    terms: pkg.terms,
    cancellationPolicy: pkg.cancellationPolicy,
    prepInstructions: pkg.prepInstructions,
    homeCollectionFee: pkg.homeCollectionFee,
    shippingFee: pkg.shippingFee,
    consultationFee: pkg.consultationFee,
    bannerImageUrl,
    theme: pkg.theme,
    highlights: pkg.highlights,
    fastingHours: pkg.fastingHours,
    genderRestriction: pkg.genderRestriction,
    minAge: pkg.minAge,
    maxAge: pkg.maxAge,
    homeCollectionAllowed: pkg.homeCollectionAllowed,
    archived: false,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  if (items.length > 0) {
    await db.insert(packageTests).values(
      items.map((item, index) => ({
        id: crypto.randomUUID(),
        packageId: newId,
        masterTestId: item.masterTestId,
        sortOrder: item.sortOrder ?? index,
      })),
    );
  }

  revalidatePath("/catalog/packages");
  revalidatePath(`/catalog/packages/${newId}`);
  return { id: newId };
}

