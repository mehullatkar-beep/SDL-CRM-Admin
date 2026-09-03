import { errorResponse, paginatedResponse, paginationSchema, publicApiAllowed, requestId } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { loadPublicTests } from "@/lib/public-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await publicApiAllowed(request))) {
    return errorResponse(request, 429, "RATE_LIMITED", "Too many requests.");
  }
  const url = new URL(request.url);
  const parsed = paginationSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return errorResponse(request, 400, "INVALID_QUERY", "Invalid pagination parameters.");
  }

  try {
    const query = (url.searchParams.get("query") || "").trim().toLowerCase();
    const tests = await loadPublicTests();
    const filtered = query
      ? tests.filter((test) =>
          [test.name, test.code, test.department, test.sampleType]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : tests;
    return paginatedResponse(request, filtered, parsed.data.page, parsed.data.pageSize);
  } catch (error) {
    logError("catalog.tests.failed", error, { requestId: requestId(request) });
    return errorResponse(request, 503, "CATALOG_UNAVAILABLE", "The catalog is temporarily unavailable.");
  }
}
