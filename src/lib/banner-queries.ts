import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { banners } from "@/db/schema";

export type BannerRecord = typeof banners.$inferSelect;

export async function loadBanners() {
  const db = await getDb();
  return db.select().from(banners).orderBy(desc(banners.updatedAt));
}

export async function loadBannerById(id: string) {
  const db = await getDb();
  const [row] = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  return row ?? null;
}
