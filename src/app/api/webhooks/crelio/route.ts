import { errorResponse } from "@/lib/api-response";

export const runtime = "nodejs";

/**
 * Reserved CrelioHealth webhook ingress. Returns 501 until the vendor documents
 * signature verification, event types, and the order/result payload contract.
 */
export async function POST(request: Request) {
  return errorResponse(
    request,
    501,
    "LIMS_WEBHOOK_NOT_CONFIGURED",
    "CrelioHealth webhooks are reserved until sandbox credentials and the signed event contract are provided.",
  );
}
