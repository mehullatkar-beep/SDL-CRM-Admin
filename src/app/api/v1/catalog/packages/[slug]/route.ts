import { dataResponse, errorResponse, publicApiAllowed, requestId } from "@/lib/api-response";
import { logError } from "@/lib/logger";
import { loadPublicPackages } from "@/lib/public-catalog";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (!(await publicApiAllowed(request))) {
    return errorResponse(request, 429, "RATE_LIMITED", "Too many requests.");
  }
  const { slug } = await params;
  try {
    const pkg = (await loadPublicPackages()).find((item) => item.slug === slug);
    if (!pkg) return errorResponse(request, 404, "PACKAGE_NOT_FOUND", "Package not found.");
    return dataResponse(request, pkg);
  } catch (error) {
    logError("catalog.package.failed", error, { requestId: requestId(request), slug });
    return errorResponse(request, 503, "CATALOG_UNAVAILABLE", "The catalog is temporarily unavailable.");
  }
}
