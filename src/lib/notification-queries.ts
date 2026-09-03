import { getDb } from "@/db";
import { notificationTriggerSettings } from "@/db/schema";
import { mergeNotificationTriggers } from "@/lib/notification-triggers";

export async function loadNotificationTriggers() {
  const db = await getDb();
  const rows = await db.select().from(notificationTriggerSettings);
  return mergeNotificationTriggers(rows);
}
