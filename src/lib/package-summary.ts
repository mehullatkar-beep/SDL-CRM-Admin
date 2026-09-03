import type { CatalogTest } from "@/lib/catalog-queries";

export type PackageTestSummary = {
  testCount: number;
  sampleTypes: string[];
  reportHours: number | null;
};

export function summarizeSelectedTests(tests: CatalogTest[]): PackageTestSummary {
  const sampleTypes = [...new Set(tests.map((test) => test.sampleType).filter(Boolean))];
  const reportHours =
    tests.length > 0 ? Math.max(...tests.map((test) => test.turnaroundHours)) : null;
  return {
    testCount: tests.length,
    sampleTypes,
    reportHours,
  };
}

export function orderedSelectedTests(tests: CatalogTest[], masterTestIds: string[]) {
  const byId = new Map(tests.map((test) => [test.id, test]));
  return masterTestIds
    .map((id) => byId.get(id))
    .filter((test): test is CatalogTest => Boolean(test));
}
