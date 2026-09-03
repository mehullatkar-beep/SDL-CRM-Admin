"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { testBookingConfigs } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

const bookingSchema = z
  .object({
    masterTestId: z.string().min(1),
    patientBookable: z.boolean(),
    physicianOrderRequired: z.boolean(),
    prepInstructions: z.string(),
    minAge: z.number().int().min(0).max(120).nullable(),
    maxAge: z.number().int().min(0).max(120).nullable(),
    genderRestriction: z.enum(["any", "male", "female"]),
    homeCollectionAllowed: z.boolean(),
    notesForPatient: z.string(),
    active: z.boolean(),
  })
  .refine((value) => value.minAge == null || value.maxAge == null || value.minAge <= value.maxAge, {
    message: "Minimum age cannot be greater than maximum age.",
    path: ["minAge"],
  });

export type BookingConfigInput = z.infer<typeof bookingSchema>;

export async function saveTestBookingConfig(input: BookingConfigInput) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid booking configuration." };
  }

  const data = parsed.data;
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(testBookingConfigs)
    .where(eq(testBookingConfigs.masterTestId, data.masterTestId))
    .limit(1);

  const row = {
    masterTestId: data.masterTestId,
    patientBookable: data.patientBookable,
    physicianOrderRequired: data.physicianOrderRequired,
    prepInstructions: data.prepInstructions.trim(),
    minAge: data.minAge,
    maxAge: data.maxAge,
    genderRestriction: data.genderRestriction,
    homeCollectionAllowed: data.homeCollectionAllowed,
    notesForPatient: data.notesForPatient.trim(),
    active: data.active,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(testBookingConfigs).set(row).where(eq(testBookingConfigs.id, existing.id));
  } else {
    await db.insert(testBookingConfigs).values({
      id: crypto.randomUUID(),
      ...row,
    });
  }

  revalidatePath("/catalog/tests");
  revalidatePath("/catalog/packages");
  return { success: true };
}
