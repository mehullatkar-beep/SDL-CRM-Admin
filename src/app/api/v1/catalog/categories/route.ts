import { dataResponse, errorResponse, publicApiAllowed, requestId } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { loadPublicPackages } from "@/lib/public-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!(await publicApiAllowed(request))) {
    return errorResponse(request, 429, "RATE_LIMITED", "Too many requests.");
  }
  try {
    const categories = [...new Set((await loadPublicPackages()).map((pkg) => pkg.category))]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
    return dataResponse(request, categories);
  } catch (error) {
    logError("catalog.categories.failed", error, { requestId: requestId(request) });
    return errorResponse(request, 503, "CATALOG_UNAVAILABLE", "The catalog is temporarily unavailable.");
  }
}
