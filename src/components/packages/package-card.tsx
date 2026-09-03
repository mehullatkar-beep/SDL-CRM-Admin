"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { PackageRowMenu } from "@/components/packages/package-row-menu";
import { formatMoney } from "@/lib/catalog";
import type { PackageListItem } from "@/lib/catalog-queries";
import { packageValidityLabel } from "@/lib/package-lifecycle";
import { cn } from "@/lib/utils";

export function PackageCard({
  pkg,
  canEdit,
  pending,
  onPreview,
  onCopy,
  onArchive,
  onUnarchive,
}: {
  pkg: PackageListItem;
  canEdit: boolean;
  pending?: boolean;
  onPreview: () => void;
  onCopy: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}) {
  const testCount = pkg.masterTestIds.length;
  const description = pkg.description.trim();

  return (
    <article
      className={cn(
        "bg-card group/card flex h-full flex-col overflow-hidden rounded-lg border",
        "transition-colors hover:border-foreground/15 hover:bg-muted/20",
      )}
    >
      <div className="bg-muted relative h-24 shrink-0 overflow-hidden">
        {pkg.bannerImageUrl ? (
          <Image
            src={pkg.bannerImageUrl}
            alt=""
            fill
            unoptimized
            className="object-cover"
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--accent),var(--muted)_70%)]">
            <ImageIcon className="text-muted-foreground/40 size-5" />
          </div>
        )}
        <div className="absolute top-1.5 right-1.5">
          <PackageRowMenu
            name={pkg.name}
            archived={pkg.archived}
            canEdit={canEdit}
            disabled={pending}
            triggerClassName="bg-background/90 text-foreground hover:bg-background size-7 shadow-xs ring-1 ring-foreground/10 backdrop-blur-sm"
            onPreview={onPreview}
            onCopy={onCopy}
            onArchive={onArchive}
            onUnarchive={onUnarchive}
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-2.5">
        <h3 className="truncate text-sm font-medium tracking-tight">{pkg.name}</h3>
        <p
          className={cn(
            "mt-0.5 truncate text-xs",
            description ? "text-muted-foreground" : "text-muted-foreground/70",
          )}
        >
          {description || "No description added"}
        </p>

        <div className="mt-2">
          <p className="text-sm font-semibold tabular-nums tracking-tight">
            {formatMoney(pkg.offerPrice)}
          </p>
          <p className="text-muted-foreground mt-0.5 truncate text-[11px] leading-4">
            {testCount} {testCount === 1 ? "test" : "tests"}
            {" · "}
            {packageValidityLabel(pkg.validFrom, pkg.validTo)}
          </p>
        </div>

        <div className="mt-auto border-t pt-2">
          <Link
            href={`/catalog/packages/${pkg.id}`}
            className="text-primary text-xs font-medium underline-offset-4 hover:underline"
          >
            View details
          </Link>
        </div>
      </div>
    </article>
  );
}
