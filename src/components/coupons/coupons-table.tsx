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
import { CouponRowMenu } from "@/components/coupons/coupon-row-menu";
import { DataTableShell } from "@/components/data-table-shell";
import { formatMoney } from "@/lib/catalog";
import { formatCouponUsage } from "@/lib/coupon-lifecycle";
import { formatPackageDate } from "@/lib/package-lifecycle";
import type { CouponRecord } from "@/lib/coupon-queries";
import type { CouponDiscountType } from "@/lib/coupons";

function discountLabel(coupon: CouponRecord) {
  const type = coupon.discountType as CouponDiscountType;
  if (type === "percent") {
    const cap = coupon.maxDiscountAmount != null ? ` (max ${formatMoney(coupon.maxDiscountAmount)})` : "";
    return `${coupon.discountValue}%${cap}`;
  }
  return formatMoney(coupon.discountValue);
}

export function CouponsTable({
  coupons: rows,
  canEdit,
  pending,
  onCopy,
  onArchive,
  onUnarchive,
}: {
  coupons: CouponRecord[];
  canEdit: boolean;
  pending?: boolean;
  onCopy: (coupon: CouponRecord) => void;
  onArchive: (coupon: CouponRecord) => void;
  onUnarchive: (coupon: CouponRecord) => void;
}) {
  return (
    <DataTableShell>
      <Table className="min-w-[960px]">
        <TableHeader className="bg-muted/35">
          <TableRow className="hover:bg-transparent">
            <TableHead className="pl-4">Coupon</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Min cart</TableHead>
            <TableHead>Schedule</TableHead>
            <TableHead>Usage</TableHead>
            <TableHead className="w-40" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((coupon) => (
            <TableRow key={coupon.id}>
              <TableCell className="pl-4">
                <div className="min-w-0">
                  <p className="font-medium">{coupon.name}</p>
                  <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wide">
                    {coupon.code}
                  </p>
                </div>
              </TableCell>
              <TableCell>{discountLabel(coupon)}</TableCell>
              <TableCell>
                {coupon.minCartAmount > 0 ? formatMoney(coupon.minCartAmount) : "None"}
              </TableCell>
              <TableCell>
                {formatPackageDate(coupon.validFrom)} – {formatPackageDate(coupon.validTo)}
              </TableCell>
              <TableCell>{formatCouponUsage(coupon.redemptionCount, coupon.maxRedemptions)}</TableCell>
              <TableCell className="pr-3">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/coupons/${coupon.id}`}>View details</Link>
                  </Button>
                  <CouponRowMenu
                    name={coupon.name}
                    archived={coupon.archived}
                    canEdit={canEdit}
                    disabled={pending}
                    onCopy={() => onCopy(coupon)}
                    onArchive={() => onArchive(coupon)}
                    onUnarchive={() => onUnarchive(coupon)}
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
