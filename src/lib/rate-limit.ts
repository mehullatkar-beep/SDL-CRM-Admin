import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { isManagedProduction } from "@/lib/env";

type LimitKind = "auth" | "public-api";

const globalForRateLimit = globalThis as unknown as {
  limiters?: Partial<Record<LimitKind, Ratelimit>>;
};

function limiter(kind: LimitKind) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  globalForRateLimit.limiters ??= {};
  globalForRateLimit.limiters[kind] ??= new Ratelimit({
    redis: Redis.fromEnv(),
    limiter:
      kind === "auth"
        ? Ratelimit.slidingWindow(5, "10 m")
        : Ratelimit.slidingWindow(120, "1 m"),
    prefix: `sdl:${kind}`,
  });
  return globalForRateLimit.limiters[kind] ?? null;
}

export async function checkRateLimit(kind: LimitKind, identifier: string) {
  const configured = limiter(kind);
  if (!configured) {
    return { success: !isManagedProduction() };
  }
  return configured.limit(identifier);
}
