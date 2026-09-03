import { describe, expect, it } from "vitest";
import { assertProductionEnv, isPrototypeMode, missingProductionEnv, shouldUseBlobStorage } from "./env";

describe("production environment validation", () => {
  it("skips required checks during next build, prototype mode, and outside Vercel production", () => {
    expect(missingProductionEnv({ NODE_ENV: "production" })).toEqual([]);
    expect(missingProductionEnv({ VERCEL_ENV: "preview" })).toEqual([]);
    expect(missingProductionEnv({ VERCEL_ENV: "production", SDL_PROTOTYPE_MODE: "true" })).toEqual(
      [],
    );
    expect(
      missingProductionEnv({
        VERCEL_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      }),
    ).toEqual([]);
    expect(() => assertProductionEnv({ NODE_ENV: "production" })).not.toThrow();
    expect(() =>
      assertProductionEnv({
        VERCEL_ENV: "production",
        NEXT_PHASE: "phase-production-build",
      }),
    ).not.toThrow();
  });

  it("fails closed when Vercel production secrets are missing", () => {
    expect(() => assertProductionEnv({ VERCEL_ENV: "production" })).toThrow(
      /Missing production environment variables/,
    );
  });

  it("treats prototype mode as non-managed production", () => {
    expect(isPrototypeMode({ SDL_PROTOTYPE_MODE: "true" })).toBe(true);
    expect(() => shouldUseBlobStorage({ VERCEL_ENV: "production", SDL_PROTOTYPE_MODE: "true" })).not.toThrow();
  });

  it("writes images to local disk for next start without a blob token", () => {
    expect(shouldUseBlobStorage({ NODE_ENV: "production" })).toBe(false);
    expect(shouldUseBlobStorage({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" })).toBe(true);
    expect(() => shouldUseBlobStorage({ VERCEL_ENV: "production" })).toThrow(
      /BLOB_READ_WRITE_TOKEN is required in production/,
    );
  });
});
