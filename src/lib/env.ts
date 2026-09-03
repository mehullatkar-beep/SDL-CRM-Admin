const PRODUCTION_REQUIRED = [
  "AUTH_SECRET",
  "DATABASE_URL",
  "BLOB_READ_WRITE_TOKEN",
  "LAB_MASTER_API_URL",
  "LAB_MASTER_API_TOKEN",
  "LAB_MASTER_LAB_PUBLIC_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
] as const;

export function isManagedProduction(env: NodeJS.Dict<string> = process.env) {
  return env.VERCEL_ENV === "production" || env.SDL_REQUIRE_PRODUCTION_ENV === "true";
}

export function isNextProductionBuild(env: NodeJS.Dict<string> = process.env) {
  return env.NEXT_PHASE === "phase-production-build";
}

export function shouldUseBlobStorage(env: NodeJS.Dict<string> = process.env) {
  if (env.BLOB_READ_WRITE_TOKEN) return true;
  if (isManagedProduction(env)) {
    throw new Error("BLOB_READ_WRITE_TOKEN is required in production.");
  }
  return false;
}

export function assertProductionEnv(env: NodeJS.Dict<string> = process.env) {
  if (isNextProductionBuild(env) || !isManagedProduction(env)) return;

  const missing: string[] = PRODUCTION_REQUIRED.filter((key) => !env[key]);
  if (env.LAB_MASTER_PROVIDER !== "http") {
    missing.push("LAB_MASTER_PROVIDER");
  }
  if (missing.length > 0) {
    throw new Error(`Missing production environment variables: ${[...new Set(missing)].join(", ")}`);
  }
}
