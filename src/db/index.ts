import "server-only";

import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { isManagedProduction } from "@/lib/env";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

const DB_CACHE_GENERATION = 8;

const globalForDb = globalThis as unknown as {
  db?: Db;
  dbPromise?: Promise<Db>;
  pglite?: PGlite;
  dbCacheGeneration?: number;
};

if (globalForDb.dbCacheGeneration !== DB_CACHE_GENERATION) {
  globalForDb.db = undefined;
  globalForDb.dbPromise = undefined;
  globalForDb.dbCacheGeneration = DB_CACHE_GENERATION;
}

function shouldUseLocalDatabase() {
  return process.env.DB_PROVIDER === "pglite" || (!process.env.DATABASE_URL && !isManagedProduction());
}

async function createDb(): Promise<Db> {
  if (shouldUseLocalDatabase()) {
    const [{ PGlite }, { drizzle: drizzlePglite }, { migrate }] = await Promise.all([
      import("@electric-sql/pglite"),
      import("drizzle-orm/pglite"),
      import("drizzle-orm/pglite/migrator"),
    ]);
    const databaseName = (process.env.PGLITE_DATABASE_NAME || "pglite").replace(/[^a-z0-9_-]/gi, "");
    globalForDb.pglite ??= new PGlite(path.join(process.cwd(), ".data", databaseName));
    await globalForDb.pglite.waitReady;
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    const { preparePgliteMigrations } = await import("./pglite-migrate");
    await preparePgliteMigrations(globalForDb.pglite, migrationsFolder);
    const local = drizzlePglite({ client: globalForDb.pglite, schema });
    await migrate(local, { migrationsFolder });
    const { seedLocalDevelopmentIfEmpty } = await import("./seed");
    await seedLocalDevelopmentIfEmpty(local as unknown as Db);
    return local as unknown as Db;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required in production.");
  }

  return drizzleNeon(neon(databaseUrl), { schema });
}

export async function getDb() {
  if (!globalForDb.dbPromise) {
    globalForDb.dbPromise = createDb().catch((error) => {
      globalForDb.dbPromise = undefined;
      throw error;
    });
  }
  globalForDb.db ??= await globalForDb.dbPromise;
  if (globalForDb.pglite) await globalForDb.pglite.waitReady;
  return globalForDb.db;
}

export type { Db };
