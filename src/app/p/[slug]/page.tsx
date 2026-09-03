import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { loadPublicPackages } from "@/lib/public-catalog";

export const dynamic = "force-dynamic";

export default async function PublicPackagePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pkg = (await loadPublicPackages()).find((item) => item.slug === slug);
  if (!pkg) notFound();
  const mobileUrl = process.env.NEXT_PUBLIC_MOBILE_APP_ORIGIN
    ? `${process.env.NEXT_PUBLIC_MOBILE_APP_ORIGIN.replace(/\/$/, "")}/packages/${pkg.slug}`
    : null;

  return (
    <main className="bg-muted/30 min-h-dvh px-4 py-8">
      <article className="mx-auto max-w-2xl overflow-hidden rounded-2xl border bg-card shadow-sm">
        {pkg.bannerImageUrl ? (
          <div className="relative aspect-[8/3]">
            <Image src={pkg.bannerImageUrl} alt="" fill className="object-cover" />
          </div>
        ) : null}
        <div className="space-y-6 p-6 sm:p-8">
          <BrandLogo className="justify-start" />
          <div>
            <p className="text-primary text-sm font-medium">{pkg.category}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{pkg.name}</h1>
            <p className="text-muted-foreground mt-3 leading-7">{pkg.description}</p>
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-semibold">
              {pkg.offerPrice.currency} {(pkg.offerPrice.amountMinor / 100).toFixed(2)}
            </span>
            {pkg.listPrice.amountMinor > pkg.offerPrice.amountMinor ? (
              <span className="text-muted-foreground line-through">
                {pkg.listPrice.currency} {(pkg.listPrice.amountMinor / 100).toFixed(2)}
              </span>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm">
            Includes {pkg.tests.length} test{pkg.tests.length === 1 ? "" : "s"}.
          </p>
          {mobileUrl ? (
            <Button asChild size="lg">
              <Link href={mobileUrl}>Open in SDL Patient App</Link>
            </Button>
          ) : (
            <p className="rounded-lg border bg-muted/40 p-4 text-sm">
              Contact SDL to book this package.
            </p>
          )}
        </div>
      </article>
    </main>
  );
}
