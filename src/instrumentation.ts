export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { missingProductionEnv } = await import("@/lib/env");
  const { logError } = await import("@/lib/logger");
  const missing = missingProductionEnv();
  if (missing.length > 0) {
    logError(
      "startup.production_env",
      new Error(`Missing production environment variables: ${missing.join(", ")}`),
      { missing },
    );
  }
}
