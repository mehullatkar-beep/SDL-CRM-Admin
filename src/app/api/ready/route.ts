import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { getLabMasterClient } from "@/lib/lab-master";

export const runtime = "nodejs";

export async function GET() {
  const checks = await Promise.allSettled([
    getDb().then((db) => db.execute(sql`select 1`)),
    getLabMasterClient().listTests(),
  ]);
  const database = checks[0]?.status === "fulfilled" ? "ok" : "unavailable";
  const labMaster = checks[1]?.status === "fulfilled" ? "ok" : "unavailable";
  const ready = database === "ok" && labMaster === "ok";

  return Response.json(
    { status: ready ? "ready" : "not_ready", checks: { database, labMaster } },
    { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
