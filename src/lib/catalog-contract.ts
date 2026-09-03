import { z } from "zod";

export const moneySchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
});

export const publicTestSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  department: z.string(),
  sampleType: z.string(),
  turnaroundHours: z.number().int().nonnegative(),
  price: moneySchema,
  physicianOrderRequired: z.boolean(),
  prepInstructions: z.string(),
  genderRestriction: z.enum(["any", "male", "female"]),
  minAge: z.number().int().nonnegative().nullable(),
  maxAge: z.number().int().nonnegative().nullable(),
  homeCollectionAllowed: z.boolean(),
  notesForPatient: z.string(),
});

export const publicPackageSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
  category: z.string(),
  fulfillmentMode: z.string(),
  validFrom: z.string().nullable(),
  validTo: z.string().nullable(),
  listPrice: moneySchema,
  offerPrice: moneySchema,
  fees: z.object({
    homeCollection: moneySchema,
    shipping: moneySchema,
    consultation: moneySchema,
  }),
  bannerImageUrl: z.string(),
  theme: z.string(),
  customAccentHex: z.string(),
  fastingHours: z.number().int().nonnegative().nullable(),
  genderRestriction: z.enum(["any", "male", "female"]),
  minAge: z.number().int().nonnegative().nullable(),
  maxAge: z.number().int().nonnegative().nullable(),
  terms: z.string(),
  cancellationPolicy: z.string(),
  tests: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      name: z.string(),
      sampleType: z.string(),
      turnaroundHours: z.number().int().nonnegative(),
    }),
  ),
});

export type PublicCatalogTest = z.infer<typeof publicTestSchema>;
export type PublicCatalogPackage = z.infer<typeof publicPackageSchema>;

export function catalogMoney(amountMajor: number, currency = process.env.NEXT_PUBLIC_CATALOG_CURRENCY || "SAR") {
  return { amountMinor: Math.round(amountMajor * 100), currency };
}
