import { redirect } from "next/navigation";
import { PackageForm } from "@/components/packages/package-form";
import { loadCatalogTests, loadPackageCategories } from "@/lib/catalog-queries";
import { requireSession } from "@/lib/session";

export default async function NewPackagePage() {
  const session = await requireSession();
  if (session.user.role !== "admin") redirect("/catalog/packages");
  const [tests, categories] = await Promise.all([loadCatalogTests(), loadPackageCategories()]);

  return <PackageForm tests={tests} categories={categories} canEdit />;
}
