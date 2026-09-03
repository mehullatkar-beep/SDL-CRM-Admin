import { slugify } from "@/lib/catalog";

export function packageSharePath(slug: string) {
  return `/p/${slugify(slug)}`;
}

export function packageShareUrl(slug: string, origin: string) {
  return `${origin.replace(/\/$/, "")}${packageSharePath(slug)}`;
}
