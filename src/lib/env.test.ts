import { describe, expect, it } from "vitest";
import { assertProductionEnv, shouldUseBlobStorage } from "./env";

describe("production environment validation", () => {
  it("skips required checks outside Vercel production", () => {
    expect(() => assertProductionEnv({ NODE_ENV: "production" })).not.toThrow();
    expect(() => assertProductionEnv({ VERCEL_ENV: "preview" })).not.toThrow();
  });

  it("fails closed when Vercel production secrets are missing", () => {
    expect(() => assertProductionEnv({ VERCEL_ENV: "production" })).toThrow(
      /Missing production environment variables/,
    );
  });

  it("writes images to local disk for next start without a blob token", () => {
    expect(shouldUseBlobStorage({ NODE_ENV: "production" })).toBe(false);
    expect(shouldUseBlobStorage({ BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_x" })).toBe(true);
    expect(() => shouldUseBlobStorage({ VERCEL_ENV: "production" })).toThrow(
      /BLOB_READ_WRITE_TOKEN is required in production/,
    );
  });
});
