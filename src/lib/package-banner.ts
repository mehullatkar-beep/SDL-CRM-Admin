import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { shouldUseBlobStorage } from "@/lib/env";

export const PACKAGE_BANNER_MAX_BYTES = 5 * 1024 * 1024;
export const PACKAGE_BANNER_PUBLIC_PREFIX = "/uploads/packages/";

const BANNER_DIR = path.join(process.cwd(), ".data", "uploads", "packages");
const FILENAME_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpe?g|png|webp)$/i;

const MIME_BY_EXT = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

type BannerExt = keyof typeof MIME_BY_EXT;

function sniffExt(bytes: Uint8Array): BannerExt | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

export function isPackageBannerFilename(filename: string) {
  return FILENAME_PATTERN.test(filename);
}

export function contentTypeForBanner(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase() as BannerExt | undefined;
  return ext && ext in MIME_BY_EXT ? MIME_BY_EXT[ext] : null;
}

export function publicBannerPath(filename: string) {
  return `${PACKAGE_BANNER_PUBLIC_PREFIX}${filename}`;
}

function filenameFromPublicUrl(url: string) {
  if (!url.startsWith(PACKAGE_BANNER_PUBLIC_PREFIX)) return null;
  const filename = url.slice(PACKAGE_BANNER_PUBLIC_PREFIX.length);
  return isPackageBannerFilename(filename) ? filename : null;
}

function isBlobUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      url.pathname.startsWith("/packages/")
    );
  } catch {
    return false;
  }
}

export function isAllowedPackageBannerUrl(value: string) {
  return value === "" || Boolean(filenameFromPublicUrl(value)) || isBlobUrl(value);
}

export async function savePackageBannerFile(file: Blob) {
  if (file.size === 0) return { error: "Choose an image file." as const };
  if (file.size > PACKAGE_BANNER_MAX_BYTES) {
    return { error: "Banner images must be 5 MB or smaller." as const };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = sniffExt(bytes);
  if (!ext) {
    return { error: "Use a JPG, PNG, or WebP image." as const };
  }

  const filename = `${crypto.randomUUID()}.${ext}`;
  if (shouldUseBlobStorage()) {
    const blob = await put(`packages/${filename}`, Buffer.from(bytes), {
      access: "public",
      addRandomSuffix: false,
      contentType: MIME_BY_EXT[ext],
    });
    return { url: blob.url };
  }

  await mkdir(BANNER_DIR, { recursive: true });
  await writeFile(path.join(BANNER_DIR, filename), bytes);
  return { url: publicBannerPath(filename) };
}

export async function readPackageBannerFile(filename: string) {
  if (!isPackageBannerFilename(filename)) return null;
  try {
    return await readFile(path.join(BANNER_DIR, filename));
  } catch {
    return null;
  }
}

export async function copyPackageBannerFile(url: string) {
  if (isBlobUrl(url)) {
    if (!shouldUseBlobStorage()) return url;
    const response = await fetch(url);
    if (!response.ok) return url;
    const ext = url.split(".").pop()?.toLowerCase() as BannerExt | undefined;
    if (!ext || !(ext in MIME_BY_EXT)) return url;
    const next = `packages/${crypto.randomUUID()}.${ext}`;
    const blob = await put(next, await response.arrayBuffer(), {
      access: "public",
      addRandomSuffix: false,
      contentType: MIME_BY_EXT[ext],
    });
    return blob.url;
  }

  const filename = filenameFromPublicUrl(url);
  if (!filename) return "";
  try {
    const bytes = await readFile(path.join(BANNER_DIR, filename));
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext || !(ext in MIME_BY_EXT)) return url;
    const next = `${crypto.randomUUID()}.${ext}`;
    await mkdir(BANNER_DIR, { recursive: true });
    await writeFile(path.join(BANNER_DIR, next), bytes);
    return publicBannerPath(next);
  } catch {
    return url;
  }
}

export async function deletePackageBannerFile(url: string) {
  if (isBlobUrl(url)) {
    if (shouldUseBlobStorage()) await del(url);
    return;
  }

  const filename = filenameFromPublicUrl(url);
  if (!filename) return;
  try {
    await unlink(path.join(BANNER_DIR, filename));
  } catch {
    // Missing files are fine — the catalog row is the source of truth.
  }
}
