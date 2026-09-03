"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BannerRowMenu } from "@/components/banners/banner-row-menu";
import { DataTableShell } from "@/components/data-table-shell";
import { bannerPlacementLabel } from "@/lib/banner-lifecycle";
import type { BannerRecord } from "@/lib/banner-queries";
import { formatPackageDate } from "@/lib/package-lifecycle";

export function BannersTable({
  banners: rows,
  canEdit,
  pending,
  onCopy,
  onArchive,
  onUnarchive,
}: {
  banners: BannerRecord[];
  canEdit: boolean;
  pending?: boolean;
  onCopy: (banner: BannerRecord) => void;
  onArchive: (banner: BannerRecord) => void;
  onUnarchive: (banner: BannerRecord) => void;
}) {
  return (
    <DataTableShell>
      <Table className="min-w-[960px]">
        <TableHeader className="bg-muted/35">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Banner</TableHead>
            <TableHead>Placement</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Sort</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((banner) => (
            <TableRow key={banner.id}>
              <TableCell className="pl-4">
                <div className="min-w-0">
                  <p className="font-medium">{banner.name}</p>
                  <p className="text-muted-foreground mt-0.5 truncate text-xs">
                    {banner.headline || (banner.imageUrl ? "Image only" : "No patient headline")}
                  </p>
                </div>
              </TableCell>
              <TableCell>{bannerPlacementLabel(banner)}</TableCell>
              <TableCell>
                {formatPackageDate(banner.validFrom)} – {formatPackageDate(banner.validTo)}
              </TableCell>
              <TableCell>{banner.sortOrder}</TableCell>
              <TableCell className="pr-3">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/banners/${banner.id}`}>View details</Link>
                  </Button>
                  <BannerRowMenu
                    name={banner.name}
                    archived={banner.archived}
                    canEdit={canEdit}
                    disabled={pending}
                    onCopy={() => onCopy(banner)}
                    onArchive={() => onArchive(banner)}
                    onUnarchive={() => onUnarchive(banner)}
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
