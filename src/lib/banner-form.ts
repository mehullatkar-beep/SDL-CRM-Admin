export type BannerFormValues = {
  id?: string;
  name: string;
  headline: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  showOnHome: boolean;
  showInNotifications: boolean;
  sortOrder: number;
  validFrom: string;
  validTo: string;
};

export function emptyBannerForm(): BannerFormValues {
  return {
    name: "",
    headline: "",
    body: "",
    imageUrl: "",
    linkUrl: "",
    showOnHome: true,
    showInNotifications: false,
    sortOrder: 0,
    validFrom: "",
    validTo: "",
  };
}

function toDateInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function bannerToFormValues(banner: {
  id: string;
  name: string;
  headline: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
  showOnHome: boolean;
  showInNotifications: boolean;
  sortOrder: number;
  validFrom: Date | null;
  validTo: Date | null;
}): BannerFormValues {
  return {
    id: banner.id,
    name: banner.name,
    headline: banner.headline,
    body: banner.body,
    imageUrl: banner.imageUrl,
    linkUrl: banner.linkUrl,
    showOnHome: banner.showOnHome,
    showInNotifications: banner.showInNotifications,
    sortOrder: banner.sortOrder,
    validFrom: toDateInput(banner.validFrom),
    validTo: toDateInput(banner.validTo),
  };
}

export function normalizeLinkUrl(value: string) {
  return value.trim();
}

export function isAllowedLinkUrl(value: string) {
  const trimmed = normalizeLinkUrl(value);
  if (!trimmed) return true;
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateBannerForm(values: BannerFormValues): string | null {
  if (values.name.trim().length < 2) return "Name is required.";
  if (!values.showOnHome && !values.showInNotifications) {
    return "Choose at least one placement: home banner or in-app notification.";
  }
  if (values.showOnHome) {
    const hasImage = Boolean(values.imageUrl.trim());
    const hasCopy = Boolean(values.headline.trim() || values.body.trim());
    if (!hasImage && !hasCopy) {
      return "Home banners need an image or headline/body copy.";
    }
  }
  if (values.showInNotifications && values.headline.trim().length < 1) {
    return "In-app notifications need a headline.";
  }
  if (!isAllowedLinkUrl(values.linkUrl)) {
    return "Link must be an https URL or a path starting with /.";
  }
  if (values.validFrom && values.validTo && values.validTo < values.validFrom) {
    return "Valid to cannot be before valid from.";
  }
  return null;
}
