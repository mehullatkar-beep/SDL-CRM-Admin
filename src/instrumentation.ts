export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { isNextProductionBuild, missingProductionEnv } = await import("@/lib/env");
  const { logError } = await import("@/lib/logger");

  if (isNextProductionBuild()) return;

  const missing = missingProductionEnv();
  if (missing.length > 0) {
    logError(
      "startup.production_env",
      new Error(`Missing production environment variables: ${missing.join(", ")}`),
      { missing },
    );
  }

  if (!process.env.DATABASE_URL) return;

  try {
    const { getDb } = await import("@/db");
    const { bootstrapProductionIfEmpty } = await import("@/db/seed");
    const result = await bootstrapProductionIfEmpty(await getDb());
    if (result.bootstrapped) {
      console.info(
        JSON.stringify({
          level: "info",
          event: "startup.bootstrap_admin",
          email: result.email,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  } catch (error) {
    logError("startup.bootstrap_admin", error);
  }
}
