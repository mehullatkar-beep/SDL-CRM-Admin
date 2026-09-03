import { errorResponse, paginatedResponse, paginationSchema, publicApiAllowed, requestId } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { loadPublicPackages } from "@/lib/public-catalog";

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
    const category = (url.searchParams.get("category") || "").trim().toLowerCase();
    const packages = (await loadPublicPackages()).filter(
      (pkg) =>
        (!query ||
          [pkg.name, pkg.description, pkg.category].join(" ").toLowerCase().includes(query)) &&
        (!category || pkg.category.toLowerCase() === category),
    );
    return paginatedResponse(request, packages, parsed.data.page, parsed.data.pageSize);
  } catch (error) {
    logError("catalog.packages.failed", error, { requestId: requestId(request) });
    return errorResponse(request, 503, "CATALOG_UNAVAILABLE", "The catalog is temporarily unavailable.");
  }
}
