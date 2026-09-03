import Link from "next/link";
import { ErrorState } from "@/components/error-state";
import { TestsCatalog } from "@/components/tests/tests-catalog";
import { AdminPageBody } from "@/components/admin-page-body";
import { Button } from "@/components/ui/button";
import { loadCatalogTests } from "@/lib/catalog-queries";
import { requireSession } from "@/lib/session";

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; department?: string; sampleType?: string; simulateError?: string }>;
}) {
  const session = await requireSession();
  const params = await searchParams;
  const simulateError =
    process.env.VERCEL_ENV !== "production" && params.simulateError === "1";

  let tests;
  let error: string | null = null;
  try {
    tests = await loadCatalogTests({
      query: params.q,
      department: params.department,
      sampleType: params.sampleType,
      simulateError,
    });
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load lab master tests.";
  }

  if (error) {
    return (
      <AdminPageBody>
        <ErrorState
          title="Lab master unavailable"
          description={error}
          action={
            <Button variant="outline" asChild>
              <Link href="/catalog/tests">Retry</Link>
            </Button>
          }
        />
      </AdminPageBody>
    );
  }

  return (
    <AdminPageBody>
      <TestsCatalog tests={tests ?? []} canEdit={session.user.role === "admin"} />
    </AdminPageBody>
  );
}
