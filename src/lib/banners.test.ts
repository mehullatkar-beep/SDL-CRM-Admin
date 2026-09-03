import { describe, expect, it } from "vitest";
import { emptyBannerForm, isAllowedLinkUrl, validateBannerForm, type BannerFormValues } from "./banner-form";
import { bannerListStatus, bannerPlacementLabel, copyBannerName } from "./banner-lifecycle";
import {
  publicBannerSchema,
  selectPublicHomeBanners,
  selectPublicNotificationBanners,
  type PublicBannerSource,
} from "./public-banners";

const now = new Date("2026-09-02T12:00:00Z");

function form(overrides: Partial<BannerFormValues> = {}): BannerFormValues {
  return { ...emptyBannerForm(), name: "Diwali 2026", ...overrides };
}

function source(overrides: Partial<PublicBannerSource> = {}): PublicBannerSource {
  return {
    id: "ban-1",
    headline: "Happy Diwali",
    body: "Book a festive package.",
    imageUrl: "",
    linkUrl: "",
    validFrom: null,
    validTo: null,
    showOnHome: true,
    showInNotifications: false,
    sortOrder: 0,
    archived: false,
    createdAt: new Date("2026-09-01T00:00:00Z"),
    ...overrides,
  };
}

describe("banner form validation", () => {
  it("allows image-only home banners and text-only home banners", () => {
    expect(validateBannerForm(form({ imageUrl: "/uploads/banners/a.jpg", headline: "", body: "" }))).toBeNull();
    expect(validateBannerForm(form({ imageUrl: "", headline: "Lab closed Friday", body: "" }))).toBeNull();
    expect(validateBannerForm(form({ imageUrl: "", headline: "", body: "Hours change next week." }))).toBeNull();
  });

  it("requires a placement, home creative, and notification headline", () => {
    expect(validateBannerForm(form({ showOnHome: false, showInNotifications: false }))).toBe(
      "Choose at least one placement: home banner or in-app notification.",
    );
    expect(validateBannerForm(form({ imageUrl: "", headline: "", body: "" }))).toBe(
      "Home banners need an image or headline/body copy.",
    );
    expect(
      validateBannerForm(
        form({ showOnHome: false, showInNotifications: true, headline: "" }),
      ),
    ).toBe("In-app notifications need a headline.");
  });

  it("accepts https and site-relative links and rejects others", () => {
    expect(isAllowedLinkUrl("")).toBe(true);
    expect(isAllowedLinkUrl("/p/wellness")).toBe(true);
    expect(isAllowedLinkUrl("https://sdl.example/offer")).toBe(true);
    expect(isAllowedLinkUrl("http://sdl.example/offer")).toBe(false);
    expect(isAllowedLinkUrl("//evil.example")).toBe(false);
    expect(validateBannerForm(form({ headline: "Hi", linkUrl: "javascript:alert(1)" }))).toBe(
      "Link must be an https URL or a path starting with /.",
    );
  });
});

describe("banner lifecycle", () => {
  it("classifies archived before expiry and scheduled before active", () => {
    expect(bannerListStatus({ archived: true, validTo: "2020-01-01" }, now)).toBe("archived");
    expect(bannerListStatus({ validTo: "2026-09-01" }, now)).toBe("expired");
    expect(bannerListStatus({ validFrom: "2026-09-10" }, now)).toBe("scheduled");
    expect(bannerListStatus({ validFrom: "2026-09-02", validTo: "2026-09-02" }, now)).toBe("active");
    expect(copyBannerName("Diwali (copy 3)")).toBe("Diwali (copy)");
    expect(bannerPlacementLabel({ showOnHome: true, showInNotifications: true })).toBe(
      "Home and inbox",
    );
  });
});

describe("public banner loaders", () => {
  it("keeps live home banners in sort order and inbox items newest first", () => {
    const rows = [
      source({ id: "later", sortOrder: 2, createdAt: new Date("2026-09-02T00:00:00Z") }),
      source({ id: "first", sortOrder: 1, createdAt: new Date("2026-09-03T00:00:00Z") }),
      source({
        id: "inbox-old",
        showOnHome: false,
        showInNotifications: true,
        createdAt: new Date("2026-08-01T00:00:00Z"),
      }),
      source({
        id: "inbox-new",
        showOnHome: false,
        showInNotifications: true,
        createdAt: new Date("2026-09-01T00:00:00Z"),
      }),
    ];
    expect(selectPublicHomeBanners(rows, now).map((row) => row.id)).toEqual(["first", "later"]);
    expect(selectPublicNotificationBanners(rows, now).map((row) => row.id)).toEqual([
      "inbox-new",
      "inbox-old",
    ]);
  });

  it("does not send headline or body on home when an image is set", () => {
    const rows = [
      source({
        id: "image-home",
        imageUrl: "/uploads/banners/festive.jpg",
        headline: "Happy Diwali",
        body: "Book a festive package.",
        showOnHome: true,
        showInNotifications: true,
      }),
    ];
    expect(selectPublicHomeBanners(rows, now)[0]).toMatchObject({
      id: "image-home",
      imageUrl: "/uploads/banners/festive.jpg",
      headline: "",
      body: "",
    });
    expect(selectPublicNotificationBanners(rows, now)[0]).toMatchObject({
      id: "image-home",
      headline: "Happy Diwali",
      body: "Book a festive package.",
    });
  });

  it("excludes scheduled, expired, archived, and the wrong placement", () => {
    const rows = [
      source({ id: "scheduled", validFrom: new Date("2026-09-10") }),
      source({ id: "expired", validTo: new Date("2026-09-01") }),
      source({ id: "archived", archived: true }),
      source({
        id: "inbox-only",
        showOnHome: false,
        showInNotifications: true,
        headline: "Lab notice",
      }),
    ];
    expect(selectPublicHomeBanners(rows, now)).toEqual([]);
    expect(selectPublicNotificationBanners(rows, now).map((row) => row.id)).toEqual(["inbox-only"]);
  });

  it("rejects incomplete public payloads at the contract boundary", () => {
    expect(() => publicBannerSchema.parse({ id: "ban-1" })).toThrow();
  });
});
