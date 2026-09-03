import { describe, expect, it } from "vitest";
import { catalogMoney, publicPackageSchema, publicTestSchema } from "./catalog-contract";

describe("patient catalog DTOs", () => {
  it("accepts a bookable test with minor-unit pricing", () => {
    const parsed = publicTestSchema.parse({
      id: "mst-cbc",
      code: "CBC",
      name: "Complete Blood Count",
      department: "Hematology",
      sampleType: "Blood",
      turnaroundHours: 12,
      price: { amountMinor: 12000, currency: "SAR" },
      physicianOrderRequired: false,
      prepInstructions: "Stay hydrated.",
      genderRestriction: "any",
      minAge: null,
      maxAge: null,
      homeCollectionAllowed: true,
      notesForPatient: "",
    });
    expect(parsed.price).toEqual({ amountMinor: 12000, currency: "SAR" });
    expect(catalogMoney(120, "SAR")).toEqual({ amountMinor: 12000, currency: "SAR" });
  });

  it("rejects incomplete package payloads at the contract boundary", () => {
    expect(() =>
      publicPackageSchema.parse({
        id: "pkg-1",
        slug: "wellness",
        name: "Wellness",
      }),
    ).toThrow();
  });
});
