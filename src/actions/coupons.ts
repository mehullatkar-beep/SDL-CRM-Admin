"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { coupons } from "@/db/schema";
import { copyCouponName } from "@/lib/coupon-lifecycle";
import { generateCouponCode, isCouponCode, normalizeCouponCode } from "@/lib/coupons";
import { requireAdmin } from "@/lib/session";

const couponSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, "Name is required."),
    code: z.string().min(1, "Code is required."),
    description: z.string(),
    discountType: z.enum(["percent", "fixed"]),
    discountValue: z.number().int().min(1, "Discount must be at least 1."),
    maxDiscountAmount: z.number().int().min(1).nullable(),
    minCartAmount: z.number().int().min(0),
    validFrom: z.string().nullable(),
    validTo: z.string().nullable(),
    maxRedemptions: z.number().int().min(1).nullable(),
    maxPerPatient: z.number().int().min(1),
  })
  .superRefine((value, ctx) => {
    const code = normalizeCouponCode(value.code);
    if (!isCouponCode(code)) {
      ctx.addIssue({
        code: "custom",
        message: "Code must be 3–24 letters or numbers.",
        path: ["code"],
      });
    }
    if (value.discountType === "percent" && value.discountValue > 100) {
      ctx.addIssue({
        code: "custom",
        message: "Percent discount cannot exceed 100.",
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
  });

export type CouponInput = z.infer<typeof couponSchema>;

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function codeTaken(code: string, excludeId?: string) {
  const db = await getDb();
  const [existing] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(excludeId ? and(eq(coupons.code, code), ne(coupons.id, excludeId)) : eq(coupons.code, code))
    .limit(1);
  return Boolean(existing);
}

async function uniqueGeneratedCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateCouponCode();
    if (!(await codeTaken(code))) return code;
  }
  return generateCouponCode(12);
}

export async function saveCoupon(input: CouponInput) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid coupon." };
  }

  const data = parsed.data;
  const code = normalizeCouponCode(data.code);
  if (await codeTaken(code, data.id)) {
    return { error: "That code is already in use." };
  }

  const db = await getDb();
  const now = new Date();
  const id = data.id ?? crypto.randomUUID();
  const row = {
    name: data.name.trim(),
    code,
    description: data.description.trim(),
    discountType: data.discountType,
    discountValue: data.discountValue,
    maxDiscountAmount: data.discountType === "percent" ? data.maxDiscountAmount : null,
    minCartAmount: data.minCartAmount,
    validFrom: parseDate(data.validFrom),
    validTo: parseDate(data.validTo),
    maxRedemptions: data.maxRedemptions,
    maxPerPatient: data.maxPerPatient,
    updatedAt: now,
  };

  if (data.id) {
    const [existing] = await db
      .select({ id: coupons.id, archived: coupons.archived })
      .from(coupons)
      .where(eq(coupons.id, data.id))
      .limit(1);
    if (!existing) return { error: "Coupon not found." };
    await db
      .update(coupons)
      .set({ ...row, active: !existing.archived })
      .where(eq(coupons.id, data.id));
  } else {
    await db.insert(coupons).values({
      id,
      createdAt: now,
      redemptionCount: 0,
      archived: false,
      active: true,
      ...row,
    });
  }

  revalidatePath("/coupons");
  revalidatePath(`/coupons/${id}`);
  return { id };
}

export async function setCouponArchived(id: string, archived: boolean) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  const [existing] = await db.select({ id: coupons.id }).from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!existing) return { error: "Coupon not found." };

  await db
    .update(coupons)
    .set({
      archived,
      active: !archived,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, id));

  revalidatePath("/coupons");
  revalidatePath(`/coupons/${id}`);
  return { success: true };
}

async function uniqueCopyName(name: string) {
  const db = await getDb();
  const proposed = copyCouponName(name);
  const [first] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(eq(coupons.name, proposed))
    .limit(1);
  if (!first) return proposed;

  const base = proposed.replace(/\s*\(copy\)$/i, "").trim() || "Coupon";
  let n = 2;
  while (n < 100) {
    const candidate = `${base} (copy ${n})`;
    const [existing] = await db
      .select({ id: coupons.id })
      .from(coupons)
      .where(eq(coupons.name, candidate))
      .limit(1);
    if (!existing) return candidate;
    n += 1;
  }
  return `${base} (copy ${crypto.randomUUID().slice(0, 8)})`;
}

export async function duplicateCoupon(id: string) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  const [coupon] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  if (!coupon) return { error: "Coupon not found." };

  const now = new Date();
  const newId = crypto.randomUUID();
  const name = await uniqueCopyName(coupon.name);
  const code = await uniqueGeneratedCode();

  await db.insert(coupons).values({
    id: newId,
    name,
    code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maxDiscountAmount: coupon.maxDiscountAmount,
    minCartAmount: coupon.minCartAmount,
    validFrom: coupon.validFrom,
    validTo: coupon.validTo,
    maxRedemptions: coupon.maxRedemptions,
    maxPerPatient: coupon.maxPerPatient,
    redemptionCount: 0,
    archived: false,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/coupons");
  revalidatePath(`/coupons/${newId}`);
  return { id: newId };
}
