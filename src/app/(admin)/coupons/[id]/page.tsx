import { notFound } from "next/navigation";
import { CouponForm } from "@/components/coupons/coupon-form";
import { couponToFormValues } from "@/lib/coupon-form";
import { loadCouponById } from "@/lib/coupon-queries";
import { requireSession } from "@/lib/session";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const coupon = await loadCouponById(id);
  if (!coupon) notFound();

  return <CouponForm canEdit={session.user.role === "admin"} initial={couponToFormValues(coupon)} />;
}
