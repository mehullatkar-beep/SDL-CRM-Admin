import { redirect } from "next/navigation";
import { BannerForm } from "@/components/banners/banner-form";
import { requireSession } from "@/lib/session";

export default async function NewBannerPage() {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/banners");

  return <BannerForm canEdit />;
}
