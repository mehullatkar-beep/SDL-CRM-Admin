import { z } from "zod";
import { bannerListStatus } from "./banner-lifecycle";

export const publicBannerSchema = z.object({
  id: z.string(),
  headline: z.string(),
  body: z.string(),
  imageUrl: z.string(),
  linkUrl: z.string(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
});

export type PublicBanner = z.infer<typeof publicBannerSchema>;

export type PublicBannerSource = {
  id: string;
  headline: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  validFrom: Date | null;
  validTo: Date | null;
  showOnHome: boolean;
  showInNotifications: boolean;
  sortOrder: number;
  archived?: boolean;
  createdAt: Date;
};

export function toPublicBanner(
  banner: PublicBannerSource,
  options: { omitCopyWhenImage?: boolean } = {},
): PublicBanner {
  const hideCopy = Boolean(options.omitCopyWhenImage && banner.imageUrl);
  return publicBannerSchema.parse({
    id: banner.id,
    headline: hideCopy ? "" : banner.headline,
    body: hideCopy ? "" : banner.body,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    validFrom: banner.validFrom?.toISOString() ?? null,
    validTo: banner.validTo?.toISOString() ?? null,
  });
}

export function selectPublicHomeBanners(rows: PublicBannerSource[], now = new Date()) {
  return rows
    .filter((banner) => banner.showOnHome && bannerListStatus(banner, now) === "active")
    .sort((a, b) => {
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .map((banner) => toPublicBanner(banner, { omitCopyWhenImage: true }));
}

export function selectPublicNotificationBanners(rows: PublicBannerSource[], now = new Date()) {
  return rows
    .filter((banner) => banner.showInNotifications && bannerListStatus(banner, now) === "active")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((banner) => toPublicBanner(banner));
}
