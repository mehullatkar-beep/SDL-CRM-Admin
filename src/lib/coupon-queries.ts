import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { coupons } from "@/db/schema";

export type CouponRecord = typeof coupons.$inferSelect;

export async function loadCoupons() {
  const db = await getDb();
  return db.select().from(coupons).orderBy(desc(coupons.updatedAt));
}

export async function loadCouponById(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(coupons).where(eq(coupons.id, id)).limit(1);
  return row ?? null;
}
