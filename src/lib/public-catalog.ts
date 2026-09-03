import "server-only";

import { loadCatalogTests, loadPackages } from "@/lib/catalog-queries";
import { catalogMoney, publicPackageSchema, publicTestSchema } from "@/lib/catalog-contract";
import { getLabMasterClient } from "@/lib/lab-master";
import { logError } from "@/lib/logger";
import { packageListStatus } from "@/lib/package-lifecycle";

export {
  catalogMoney,
  publicPackageSchema,
  publicTestSchema,
  type PublicCatalogPackage,
  type PublicCatalogTest,
} from "@/lib/catalog-contract";

export async function loadPublicTests() {
  const tests = await loadCatalogTests();
  return tests
    .filter(({ booking }) => booking?.patientBookable && booking.active)
    .map((test) =>
      publicTestSchema.parse({
        id: test.id,
        code: test.code,
        name: test.name,
        department: test.department,
        sampleType: test.sampleType,
        turnaroundHours: test.turnaroundHours,
        price: catalogMoney(test.listPrice),
        physicianOrderRequired:
          test.requiresPhysicianOrder || Boolean(test.booking?.physicianOrderRequired),
        prepInstructions: test.booking?.prepInstructions || test.defaultPrepNotes,
        genderRestriction: test.booking?.genderRestriction || test.genderRestriction,
        minAge: test.booking?.minAge ?? test.minAge,
        maxAge: test.booking?.maxAge ?? test.maxAge,
        homeCollectionAllowed: Boolean(test.booking?.homeCollectionAllowed),
        notesForPatient: test.booking?.notesForPatient || "",
      }),
    );
}

export async function loadPublicPackages() {
  const [packages, masterTests] = await Promise.all([
    loadPackages(),
    getLabMasterClient().listTests(),
  ]);
  const testsById = new Map(masterTests.map((test) => [test.id, test]));

  return packages
    .filter(
      (pkg) =>
        pkg.visibility === "public" &&
        pkg.active &&
        !pkg.archived &&
        packageListStatus(pkg) === "active",
    )
    .map((pkg) =>
      publicPackageSchema.parse({
        id: pkg.id,
        slug: pkg.slug,
        name: pkg.name,
        description: pkg.description,
        category: pkg.category,
        fulfillmentMode: pkg.fulfillmentMode,
        validFrom: pkg.validFrom?.toISOString() ?? null,
        validTo: pkg.validTo?.toISOString() ?? null,
        listPrice: catalogMoney(pkg.listPrice),
        offerPrice: catalogMoney(pkg.offerPrice),
        fees: {
          homeCollection: catalogMoney(pkg.homeCollectionFee),
          shipping: catalogMoney(pkg.shippingFee),
          consultation: catalogMoney(pkg.consultationFee),
        },
        bannerImageUrl: pkg.bannerImageUrl,
        theme: pkg.theme,
        customAccentHex: pkg.customAccentHex,
        fastingHours: pkg.fastingHours,
        genderRestriction: pkg.genderRestriction,
        minAge: pkg.minAge,
        maxAge: pkg.maxAge,
        terms: pkg.terms,
        cancellationPolicy: pkg.cancellationPolicy,
        tests: pkg.masterTestIds.flatMap((id) => {
          const test = testsById.get(id);
          if (!test) {
            logError("catalog.orphan_master_test", new Error("Unknown master test on package"), {
              packageId: pkg.id,
              masterTestId: id,
            });
            return [];
          }
          return [{
            id: test.id,
            code: test.code,
            name: test.name,
            sampleType: test.sampleType,
            turnaroundHours: test.turnaroundHours,
          }];
        }),
      }),
    );
}
