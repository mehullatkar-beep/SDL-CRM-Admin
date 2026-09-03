import { notFound } from "next/navigation";
import { PackageForm } from "@/components/packages/package-form";
import { loadCatalogTests, loadPackageById, loadPackageCategories } from "@/lib/catalog-queries";
import { packageToFormValues } from "@/lib/package-form";
import { requireSession } from "@/lib/session";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const [pkg, tests, categories] = await Promise.all([
    loadPackageById(id),
    loadCatalogTests(),
    loadPackageCategories(),
  ]);
  if (!pkg) notFound();

  return (
    <PackageForm
      tests={tests}
      categories={categories}
      canEdit={session.user.role === "admin"}
      initial={packageToFormValues(pkg)}
    />
  );
}
