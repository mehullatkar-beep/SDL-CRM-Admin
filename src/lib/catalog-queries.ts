import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packageCategories, packageTests, packages, testBookingConfigs } from "@/db/schema";
import { getLabMasterClient, type MasterTest } from "@/lib/lab-master";

export type BookingConfig = typeof testBookingConfigs.$inferSelect;

export type CatalogTest = MasterTest & {
  booking: BookingConfig | null;
};

export type PackageListItem = Awaited<ReturnType<typeof loadPackages>>[number];

export async function loadCatalogTests(options?: {
  query?: string;
  department?: string;
  sampleType?: string;
  simulateError?: boolean;
}) {
  const client = getLabMasterClient({ simulateError: options?.simulateError });
  const [masterTests, db] = await Promise.all([
    client.listTests({
      query: options?.query,
      department: options?.department,
      sampleType: options?.sampleType,
    }),
    getDb(),
  ]);
  const configs = await db.select().from(testBookingConfigs);
  const byMasterId = new Map(configs.map((row) => [row.masterTestId, row]));

  return masterTests.map((test) => ({
    ...test,
    booking: byMasterId.get(test.id) ?? null,
  })) satisfies CatalogTest[];
}

export async function loadPackageById(id: string) {
  const db = await getDb();
  const [pkg] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!pkg) return null;
  const items = await db
    .select()
    .from(packageTests)
    .where(eq(packageTests.packageId, id))
    .orderBy(asc(packageTests.sortOrder));
  return { ...pkg, masterTestIds: items.map((item) => item.masterTestId) };
}

export async function loadPackages() {
  const db = await getDb();
  const rows = await db.select().from(packages).orderBy(asc(packages.name));
  const links = await db.select().from(packageTests).orderBy(asc(packageTests.sortOrder));
  const testsByPackage = new Map<string, string[]>();
  for (const link of links) {
    const list = testsByPackage.get(link.packageId) ?? [];
    list.push(link.masterTestId);
    testsByPackage.set(link.packageId, list);
  }
  return rows.map((row) => ({
    ...row,
    masterTestIds: testsByPackage.get(row.id) ?? [],
  }));
}

export async function loadPackageCategories() {
  const db = await getDb();
  const rows = await db
    .select({ name: packageCategories.name })
    .from(packageCategories)
    .orderBy(asc(packageCategories.name));
  return rows.map((row) => row.name);
}
