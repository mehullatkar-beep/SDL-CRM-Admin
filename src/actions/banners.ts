"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { banners } from "@/db/schema";
import { copyBannerName } from "@/lib/banner-lifecycle";
import { isAllowedLinkUrl, normalizeLinkUrl, validateBannerForm } from "@/lib/banner-form";
import {
  copyBannerImageFile,
  deleteBannerImageFile,
  isAllowedBannerImageUrl,
  saveBannerImageFile,
} from "@/lib/banner-image";
import { requireAdmin } from "@/lib/session";
import { logError } from "@/lib/logger";

const bannerSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().min(2, "Name is required."),
    headline: z.string(),
    body: z.string(),
    imageUrl: z.string(),
    linkUrl: z.string(),
    showOnHome: z.boolean(),
    showInNotifications: z.boolean(),
    sortOrder: z.number().int(),
    validFrom: z.string().nullable(),
    validTo: z.string().nullable(),
  })
  .superRefine((value, ctx) => {
    const error = validateBannerForm({
      name: value.name,
      headline: value.headline,
      body: value.body,
      imageUrl: value.imageUrl,
      linkUrl: value.linkUrl,
      showOnHome: value.showOnHome,
      showInNotifications: value.showInNotifications,
      sortOrder: value.sortOrder,
      validFrom: value.validFrom ?? "",
      validTo: value.validTo ?? "",
    });
    if (error) {
      ctx.addIssue({ code: "custom", message: error });
    }
    if (!isAllowedBannerImageUrl(value.imageUrl)) {
      ctx.addIssue({ code: "custom", message: "Upload a banner image from this form.", path: ["imageUrl"] });
    }
    if (!isAllowedLinkUrl(value.linkUrl)) {
      ctx.addIssue({
        code: "custom",
        message: "Link must be an https URL or a path starting with /.",
        path: ["linkUrl"],
      });
    }
  });

export type BannerInput = z.infer<typeof bannerSchema>;

function parseDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function saveBanner(input: BannerInput) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid banner." };
  }

  const data = parsed.data;
  const db = await getDb();
  const now = new Date();
  const id = data.id ?? crypto.randomUUID();
  const row = {
    name: data.name.trim(),
    headline: data.headline.trim(),
    body: data.body.trim(),
    imageUrl: data.imageUrl,
    linkUrl: normalizeLinkUrl(data.linkUrl),
    showOnHome: data.showOnHome,
    showInNotifications: data.showInNotifications,
    sortOrder: data.sortOrder,
    validFrom: parseDate(data.validFrom),
    validTo: parseDate(data.validTo),
    updatedAt: now,
  };

  if (data.id) {
    const [existing] = await db
      .select({ id: banners.id, archived: banners.archived, imageUrl: banners.imageUrl })
      .from(banners)
      .where(eq(banners.id, data.id))
      .limit(1);
    if (!existing) return { error: "Banner not found." };
    if (existing.imageUrl && existing.imageUrl !== data.imageUrl) {
      await deleteBannerImageFile(existing.imageUrl);
    }
    await db
      .update(banners)
      .set({ ...row, active: !existing.archived })
      .where(eq(banners.id, data.id));
  } else {
    await db.insert(banners).values({
      id,
      createdAt: now,
      archived: false,
      active: true,
      ...row,
    });
  }

  revalidatePath("/banners");
  revalidatePath(`/banners/${id}`);
  return { id };
}

export async function setBannerArchived(id: string, archived: boolean) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  const [existing] = await db.select({ id: banners.id }).from(banners).where(eq(banners.id, id)).limit(1);
  if (!existing) return { error: "Banner not found." };

  await db
    .update(banners)
    .set({
      archived,
      active: !archived,
      updatedAt: new Date(),
    })
    .where(eq(banners.id, id));

  revalidatePath("/banners");
  revalidatePath(`/banners/${id}`);
  return { success: true };
}

async function uniqueCopyName(name: string) {
  const db = await getDb();
  const proposed = copyBannerName(name);
  const [first] = await db
    .select({ id: banners.id })
    .from(banners)
    .where(eq(banners.name, proposed))
    .limit(1);
  if (!first) return proposed;

  const base = proposed.replace(/\s*\(copy\)$/i, "").trim() || "Banner";
  let n = 2;
  while (n < 100) {
    const candidate = `${base} (copy ${n})`;
    const [existing] = await db
      .select({ id: banners.id })
      .from(banners)
      .where(eq(banners.name, candidate))
      .limit(1);
    if (!existing) return candidate;
    n += 1;
  }
  return `${base} (copy ${crypto.randomUUID().slice(0, 8)})`;
}

export async function duplicateBanner(id: string) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const db = await getDb();
  const [banner] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!banner) return { error: "Banner not found." };

  const now = new Date();
  const newId = crypto.randomUUID();
  const name = await uniqueCopyName(banner.name);
  const imageUrl = banner.imageUrl ? await copyBannerImageFile(banner.imageUrl) : "";

  await db.insert(banners).values({
    id: newId,
    name,
    headline: banner.headline,
    body: banner.body,
    imageUrl,
    linkUrl: banner.linkUrl,
    showOnHome: banner.showOnHome,
    showInNotifications: banner.showInNotifications,
    sortOrder: banner.sortOrder,
    validFrom: banner.validFrom,
    validTo: banner.validTo,
    archived: false,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/banners");
  revalidatePath(`/banners/${newId}`);
  return { id: newId };
}

export async function uploadBannerImage(formData: FormData) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return { error: "Choose an image file." as const };
  }

  try {
    const result = await saveBannerImageFile(file);
    if ("error" in result) return { error: result.error };
    return { url: result.url };
  } catch (caught) {
    logError("banners.image.upload_failed", caught);
    return { error: "Could not save the image. Try again." as const };
  }
}
