import { redirect } from "next/navigation";
import { CouponForm } from "@/components/coupons/coupon-form";
import { requireSession } from "@/lib/session";

export default async function NewCouponPage() {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/coupons");

  return <CouponForm canEdit />;
}
