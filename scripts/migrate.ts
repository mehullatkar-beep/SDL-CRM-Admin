import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { migrate as migrateNeon } from "drizzle-orm/neon-http/migrator";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { preparePgliteMigrations } from "../src/db/pglite-migrate";

loadEnvConfig(process.cwd());

async function main() {
  const migrationsFolder = path.join(process.cwd(), "drizzle");
  const databaseUrl = process.env.DATABASE_URL;
  const useLocal =
    process.env.DB_PROVIDER === "pglite" ||
    (!databaseUrl && process.env.NODE_ENV !== "production");

  if (useLocal) {
    const databaseName = (process.env.PGLITE_DATABASE_NAME || "pglite").replace(/[^a-z0-9_-]/gi, "");
    const client = new PGlite(path.join(process.cwd(), ".data", databaseName));
    await client.waitReady;
    await preparePgliteMigrations(client, migrationsFolder);
    await migratePglite(drizzlePglite(client), { migrationsFolder });
    await client.close();
    console.info("Applied migrations to local PGlite.");
  } else {
    if (!databaseUrl) throw new Error("DATABASE_URL is required.");
    await migrateNeon(drizzleNeon(neon(databaseUrl)), { migrationsFolder });
    console.info("Applied migrations to managed Postgres.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
