import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const requestIds = new WeakMap<Request, string>();

export function requestId(request: Request) {
  const existing = requestIds.get(request);
  if (existing) return existing;
  const next = request.headers.get("x-request-id") || crypto.randomUUID();
  requestIds.set(request, next);
  return next;
}

function allowedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  const allowed = (process.env.ALLOWED_API_ORIGINS || process.env.NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return allowed.includes(origin) ? origin : null;
}

function baseHeaders(request: Request, cacheControl = "public, s-maxage=60, stale-while-revalidate=300") {
  const origin = allowedOrigin(request);
  return {
    "Cache-Control": cacheControl,
    "Content-Type": "application/json",
    "X-Request-Id": requestId(request),
    ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  };
}

export function paginatedResponse<T>(
  request: Request,
  values: T[],
  page: number,
  pageSize: number,
) {
  const total = values.length;
  const start = (page - 1) * pageSize;
  return Response.json(
    {
      data: values.slice(start, start + pageSize),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    },
    { headers: baseHeaders(request) },
  );
}

export function dataResponse<T>(request: Request, data: T, cacheControl?: string) {
  return Response.json({ data }, { headers: baseHeaders(request, cacheControl) });
}

export function errorResponse(request: Request, status: number, code: string, message: string) {
  return Response.json(
    { error: { code, message } },
    { status, headers: baseHeaders(request, "no-store") },
  );
}

export async function publicApiAllowed(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const identifier = forwardedFor || request.headers.get("x-real-ip") || "unknown";
  return (await checkRateLimit("public-api", identifier)).success;
}
