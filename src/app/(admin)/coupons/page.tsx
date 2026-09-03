import Link from "next/link";
import { CouponsCatalog } from "@/components/coupons/coupons-catalog";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { AdminPageBody } from "@/components/admin-page-body";
import { loadCoupons } from "@/lib/coupon-queries";
import { requireSession } from "@/lib/session";

export default async function CouponsPage() {
  const session = await requireSession();
  let rows: Awaited<ReturnType<typeof loadCoupons>> = [];
  let error: string | null = null;
  try {
    rows = await loadCoupons();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Could not load coupons.";
  }

  if (error) {
    return (
      <AdminPageBody>
        <ErrorState
          title="Coupons unavailable"
          description={error}
          action={
            <Button variant="outline" asChild>
              <Link href="/coupons">Retry</Link>
            </Button>
          }
        />
      </AdminPageBody>
    );
  }

  return (
    <AdminPageBody className="py-4 lg:py-5">
      <CouponsCatalog coupons={rows} canEdit={session.user.role === "admin"} />
    </AdminPageBody>
  );
}
