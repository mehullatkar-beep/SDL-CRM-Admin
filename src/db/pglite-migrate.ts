import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { PGlite } from "@electric-sql/pglite";

type Journal = {
  entries: { tag: string; when: number }[];
};

/**
 * Older local DBs were created before Drizzle's journal was always applied.
 * Stamp the first migration as already run so later files (e.g. coupons) can apply.
 */
export async function preparePgliteMigrations(client: PGlite, migrationsFolder: string) {
  const users = await client.query<{ present: boolean }>(
    `select exists (
       select 1 from information_schema.tables
       where table_schema = 'public' and table_name = 'users'
     ) as present`,
  );
  if (!users.rows[0]?.present) return;

  await client.exec(`CREATE SCHEMA IF NOT EXISTS drizzle`);
  await client.exec(`CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
  )`);

  const last = await client.query<{ created_at: string }>(
    `select created_at from drizzle.__drizzle_migrations order by created_at desc limit 1`,
  );
  if (last.rows.length > 0) return;

  const journal = JSON.parse(
    fs.readFileSync(path.join(migrationsFolder, "meta/_journal.json"), "utf8"),
  ) as Journal;
  const baseline = journal.entries[0];
  if (!baseline) return;

  const sqlFile = fs.readFileSync(path.join(migrationsFolder, `${baseline.tag}.sql`), "utf8");
  const hash = crypto.createHash("sha256").update(sqlFile).digest("hex");
  await client.query(`insert into drizzle.__drizzle_migrations (hash, created_at) values ($1, $2)`, [
    hash,
    baseline.when,
  ]);
}
