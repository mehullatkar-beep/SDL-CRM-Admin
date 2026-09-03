import Link from "next/link";
import { PackagesCatalog } from "@/components/packages/packages-catalog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { AdminPageBody } from "@/components/admin-page-body";
import { loadPackages } from "@/lib/catalog-queries";
import { requireSession } from "@/lib/session";

export default async function PackagesPage() {
  const session = await requireSession();
  let rows: Awaited<ReturnType<typeof loadPackages>> = [];
  let error: string | null = null;
  try {
    rows = await loadPackages();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load packages.";
  }

  if (error) {
    return (
      <AdminPageBody>
        <ErrorState
          title="Packages unavailable"
          description={error}
          action={
            <Button variant="outline" asChild>
              <Link href="/catalog/packages">Retry</Link>
            </Button>
          }
        />
      </AdminPageBody>
    );
  }

  return (
    <AdminPageBody className="py-4 lg:py-5">
      <PackagesCatalog packages={rows} canEdit={session.user.role === "admin"} />
    </AdminPageBody>
  );
}
