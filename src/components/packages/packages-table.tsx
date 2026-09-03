"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { PackageRowMenu } from "@/components/packages/package-row-menu";
import { DataTableShell } from "@/components/data-table-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatMoney } from "@/lib/catalog";
import type { PackageListItem } from "@/lib/catalog-queries";
import { formatPackageDate } from "@/lib/package-lifecycle";

export function PackagesTable({
  packages: rows,
  canEdit,
  pending,
  onPreview,
  onCopy,
  onArchive,
  onUnarchive,
}: {
  packages: PackageListItem[];
  canEdit: boolean;
  pending?: boolean;
  onPreview: (pkg: PackageListItem) => void;
  onCopy: (pkg: PackageListItem) => void;
  onArchive: (pkg: PackageListItem) => void;
  onUnarchive: (pkg: PackageListItem) => void;
}) {
  return (
    <DataTableShell>
      <Table className="min-w-[920px]">
        <TableHeader className="bg-muted/35">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Name</TableHead>
            <TableHead>Tests</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  {pkg.bannerImageUrl ? (
                    <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
                      <Image
                        src={pkg.bannerImageUrl}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                        sizes="64px"
                      />
                    </span>
                  ) : (
                    <span className="bg-muted text-muted-foreground flex h-10 w-16 shrink-0 items-center justify-center rounded-md ring-1 ring-border">
                      <ImageIcon className="size-4" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium">{pkg.name}</p>
                    <p className="text-muted-foreground line-clamp-1 text-xs">
                      {pkg.description.trim() || "No description added"}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell>{pkg.masterTestIds.length}</TableCell>
              <TableCell>{formatMoney(pkg.offerPrice)}</TableCell>
              <TableCell>{formatPackageDate(pkg.validFrom)}</TableCell>
              <TableCell>{formatPackageDate(pkg.validTo)}</TableCell>
              <TableCell className="pr-3">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/catalog/packages/${pkg.id}`}>View details</Link>
                  </Button>
                  <PackageRowMenu
                    name={pkg.name}
                    archived={pkg.archived}
                    canEdit={canEdit}
                    disabled={pending}
                    onPreview={() => onPreview(pkg)}
                    onCopy={() => onCopy(pkg)}
                    onArchive={() => onArchive(pkg)}
                    onUnarchive={() => onUnarchive(pkg)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableShell>
  );
}
