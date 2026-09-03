import {
  contentTypeForBannerImage,
  isBannerImageFilename,
  readBannerImageFile,
} from "@/lib/banner-image";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;
  if (!isBannerImageFilename(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const file = await readBannerImageFile(filename);
  const contentType = contentTypeForBannerImage(filename);
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
