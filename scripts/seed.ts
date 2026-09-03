import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "../src/db/schema";
import { seedCatalogDefaults } from "../src/db/seed";

loadEnvConfig(process.cwd());

type Db = ReturnType<typeof drizzleNeon<typeof schema>>;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const useLocal =
    process.env.DB_PROVIDER === "pglite" ||
    (!databaseUrl && process.env.NODE_ENV !== "production");
  const demoUsers = process.env.SEED_DEMO_USERS === "true";

  if (useLocal) {
    const databaseName = (process.env.PGLITE_DATABASE_NAME || "pglite").replace(/[^a-z0-9_-]/gi, "");
    const client = new PGlite(path.join(process.cwd(), ".data", databaseName));
    await client.waitReady;
    const result = await seedCatalogDefaults(drizzlePglite({ client, schema }) as unknown as Db, {
      demoUsers,
    });
    await client.close();
    console.info(
      result.seededAdmin
        ? result.demo
          ? "Demo users and categories seeded."
          : "Bootstrap admin and categories seeded."
        : "Categories seeded. No admin credentials were provided.",
    );
    return;
  }

  if (!databaseUrl) throw new Error("DATABASE_URL is required.");
  const result = await seedCatalogDefaults(drizzleNeon(neon(databaseUrl), { schema }), { demoUsers });
  console.info(
    result.seededAdmin
      ? result.demo
        ? "Demo users and categories seeded."
        : "Bootstrap admin and categories seeded."
      : "Categories seeded. No admin credentials were provided.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
