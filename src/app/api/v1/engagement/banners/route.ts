import { errorResponse, paginatedResponse, paginationSchema, publicApiAllowed, requestId } from "@/lib/api-response";
import { loadBanners } from "@/lib/banner-queries";
import { logError } from "@/lib/logger";
import { selectPublicHomeBanners } from "@/lib/public-banners";

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
    const banners = selectPublicHomeBanners(await loadBanners());
    return paginatedResponse(request, banners, parsed.data.page, parsed.data.pageSize);
  } catch (error) {
    logError("engagement.banners.failed", error, { requestId: requestId(request) });
    return errorResponse(request, 503, "ENGAGEMENT_UNAVAILABLE", "Announcements are temporarily unavailable.");
  }
}
