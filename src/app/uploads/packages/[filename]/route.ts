import { contentTypeForBanner, isPackageBannerFilename, readPackageBannerFile } from "@/lib/package-banner";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!isPackageBannerFilename(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const file = await readPackageBannerFile(filename);
  const contentType = contentTypeForBanner(filename);
  if (!file || !contentType) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin":
        process.env.NEXT_PUBLIC_PATIENT_PORTAL_ORIGIN ?? "http://localhost:3000",
      Vary: "Origin",
    },
  });
}
