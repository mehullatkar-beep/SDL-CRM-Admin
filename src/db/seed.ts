import { hash } from "bcryptjs";
import { count } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { packageCategories, users } from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

const DEFAULT_CATEGORIES = [
  "Diabetes",
  "Wellness",
  "Heart",
  "Thyroid",
  "Women's health",
  "Men's health",
  "Full body",
  "Infectious disease",
];

export async function seedCatalogDefaults(db: Db, options?: { demoUsers?: boolean }) {
  await db
    .insert(packageCategories)
    .values(DEFAULT_CATEGORIES.map((name) => ({ id: crypto.randomUUID(), name })))
    .onConflictDoNothing({ target: packageCategories.name });

  const demo = Boolean(options?.demoUsers);
  const email = demo ? "admin@sdl.local" : process.env.BOOTSTRAP_ADMIN_EMAIL;
  const password = demo ? "Admin123!" : process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (!email || !password) return { seededAdmin: false, demo };

  await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email: email.trim().toLowerCase(),
      name: process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Lab Admin",
      passwordHash: await hash(password, 12),
      role: "admin",
    })
    .onConflictDoNothing({ target: users.email });

  if (demo) {
    await db
      .insert(users)
      .values({
        id: crypto.randomUUID(),
        email: "crm@sdl.local",
        name: "CRM Specialist",
        passwordHash: await hash("Crm123!", 12),
        role: "crm",
      })
      .onConflictDoNothing({ target: users.email });
  }

  return { seededAdmin: true, demo };
}

export async function seedLocalDevelopmentIfEmpty(db: Db) {
  if (process.env.NODE_ENV === "production") return;
  const [row] = await db.select({ value: count() }).from(users);
  if ((row?.value ?? 0) > 0) return;
  await seedCatalogDefaults(db, { demoUsers: process.env.SEED_DEMO_USERS !== "false" });
}
