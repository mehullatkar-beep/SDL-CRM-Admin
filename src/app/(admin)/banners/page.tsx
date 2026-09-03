import Link from "next/link";
import { BannersCatalog } from "@/components/banners/banners-catalog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { AdminPageBody } from "@/components/admin-page-body";
import { loadBanners } from "@/lib/banner-queries";
import { requireSession } from "@/lib/session";

export default async function BannersPage() {
  const session = await requireSession();
  let rows: Awaited<ReturnType<typeof loadBanners>> = [];
  let error: string | null = null;
  try {
    rows = await loadBanners();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load banners.";
  }

  if (error) {
    return (
      <AdminPageBody>
        <ErrorState
          title="Banners unavailable"
          description={error}
          action={
            <Button variant="outline" asChild>
              <Link href="/banners">Retry</Link>
            </Button>
          }
        />
      </AdminPageBody>
    );
  }

  return (
    <AdminPageBody className="py-4 lg:py-5">
      <BannersCatalog banners={rows} canEdit={session.user.role === "admin"} />
    </AdminPageBody>
  );
}
