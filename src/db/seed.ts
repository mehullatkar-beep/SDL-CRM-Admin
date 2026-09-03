import { hash } from "bcryptjs";
import { count } from "drizzle-orm";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { isPrototypeMode } from "@/lib/env";
import * as schema from "./schema";
import { packageCategories, users } from "./schema";
import { seedPrototypeDemoContent } from "./prototype-seed";

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
  if (process.env.NODE_ENV === "production" && !isPrototypeMode()) return;
  const [row] = await db.select({ value: count() }).from(users);
  if ((row?.value ?? 0) > 0) return;
  await seedCatalogDefaults(db, { demoUsers: process.env.SEED_DEMO_USERS !== "false" });
  if (isPrototypeMode()) {
    await seedPrototypeDemoContent(db);
  }
}

/** Seeds demo or bootstrap users on first deploy. Safe to run on every cold start. */
export async function seedDeployedEnvironmentIfEmpty(db: Db) {
  if (!process.env.DATABASE_URL) {
    return { seeded: false as const, reason: "no_database" as const };
  }

  const [row] = await db.select({ value: count() }).from(users);
  if ((row?.value ?? 0) > 0) {
    return { seeded: false as const, reason: "users_exist" as const };
  }

  if (isPrototypeMode()) {
    const result = await seedCatalogDefaults(db, { demoUsers: true });
    if (!result.seededAdmin) {
      return { seeded: false as const, reason: "seed_skipped" as const };
    }
    await seedPrototypeDemoContent(db);
    return { seeded: true as const, mode: "prototype" as const, email: "admin@sdl.local" };
  }

  if (!process.env.BOOTSTRAP_ADMIN_EMAIL || !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    return { seeded: false as const, reason: "no_bootstrap_credentials" as const };
  }

  const result = await seedCatalogDefaults(db, { demoUsers: false });
  if (!result.seededAdmin) {
    return { seeded: false as const, reason: "seed_skipped" as const };
  }

  return {
    seeded: true as const,
    mode: "bootstrap" as const,
    email: process.env.BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase(),
  };
}
