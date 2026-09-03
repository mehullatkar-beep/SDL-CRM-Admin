import { notFound } from "next/navigation";
import { BannerForm } from "@/components/banners/banner-form";
import { bannerToFormValues } from "@/lib/banner-form";
import { loadBannerById } from "@/lib/banner-queries";
import { requireSession } from "@/lib/session";

export default async function EditBannerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const banner = await loadBannerById(id);
  if (!banner) notFound();

  return <BannerForm canEdit={session.user.role === "admin"} initial={bannerToFormValues(banner)} />;
}
