export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { isNextProductionBuild, isPrototypeMode, missingProductionEnv } = await import("@/lib/env");
  const { logError } = await import("@/lib/logger");

  if (isNextProductionBuild()) return;

  if (!isPrototypeMode()) {
    const missing = missingProductionEnv();
    if (missing.length > 0) {
      logError(
        "startup.production_env",
        new Error(`Missing production environment variables: ${missing.join(", ")}`),
        { missing },
      );
    }
  }

  if (!process.env.DATABASE_URL) return;

  try {
    const { getDb } = await import("@/db");
    const { seedDeployedEnvironmentIfEmpty } = await import("@/db/seed");
    const result = await seedDeployedEnvironmentIfEmpty(await getDb());
    if (result.seeded) {
      console.info(
        JSON.stringify({
          level: "info",
          event: "startup.seed_deployed",
          mode: result.mode,
          email: result.email,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  } catch (error) {
    logError("startup.seed_deployed", error);
  }
}
