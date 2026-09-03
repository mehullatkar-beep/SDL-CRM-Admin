"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { notificationTriggerSettings } from "@/db/schema";
import { isNotificationTriggerId } from "@/lib/notification-triggers";
import { requireAdmin } from "@/lib/session";

const toggleSchema = z.object({
  triggerId: z.string().refine(isNotificationTriggerId, "Unknown notification trigger."),
  enabled: z.boolean(),
});

export async function setNotificationTriggerEnabled(triggerId: string, enabled: boolean) {
  const { error } = await requireAdmin();
  if (error) return { error };

  const parsed = toggleSchema.safeParse({ triggerId, enabled });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid notification trigger." };
  }

  const db = await getDb();
  const now = new Date();
  const [existing] = await db
    .select()
    .from(notificationTriggerSettings)
    .where(eq(notificationTriggerSettings.triggerId, parsed.data.triggerId))
    .limit(1);

  if (existing) {
    await db
      .update(notificationTriggerSettings)
      .set({ enabled: parsed.data.enabled, updatedAt: now })
      .where(eq(notificationTriggerSettings.triggerId, parsed.data.triggerId));
  } else {
    await db.insert(notificationTriggerSettings).values({
      triggerId: parsed.data.triggerId,
      enabled: parsed.data.enabled,
      updatedAt: now,
    });
  }

  revalidatePath("/notifications");
  return { success: true as const };
}
