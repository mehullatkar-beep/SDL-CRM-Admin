"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Search, SearchX, TicketPercent } from "lucide-react";
import { duplicateCoupon, setCouponArchived } from "@/actions/coupons";
import { CouponsTable } from "@/components/coupons/coupons-table";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { couponListStatus, type CouponListStatus } from "@/lib/coupon-lifecycle";
import type { CouponRecord } from "@/lib/coupon-queries";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { id: CouponListStatus; label: string }[] = [
  { id: "active", label: "Active coupons" },
  { id: "scheduled", label: "Scheduled coupons" },
  { id: "expired", label: "Expired coupons" },
  { id: "archived", label: "Archived coupons" },
];

const TAB_COPY: Record<CouponListStatus, { emptyTitle: string; emptyDescription: string }> = {
  active: {
    emptyTitle: "No active coupons",
    emptyDescription: "Coupons that are currently in their validity window appear here.",
  },
  scheduled: {
    emptyTitle: "No scheduled coupons",
    emptyDescription: "Coupons whose start date is still in the future will show here.",
  },
  expired: {
    emptyTitle: "No expired coupons",
    emptyDescription: "Coupons whose end date has passed will move here automatically.",
  },
  archived: {
    emptyTitle: "No archived coupons",
    emptyDescription: "Archive a coupon from the menu when you no longer want it in the active list.",
  },
};

function matchesQuery(coupon: CouponRecord, query: string) {
  if (!query) return true;
  const haystack = [coupon.name, coupon.code, coupon.description].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function CouponsCatalog({
  coupons: rows,
  canEdit,
}: {
  coupons: CouponRecord[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<CouponListStatus>("active");
  const [archiveTarget, setArchiveTarget] = useState<CouponRecord | null>(null);
  const [pending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();

  const grouped = useMemo(() => {
    const matched = rows.filter((coupon) => matchesQuery(coupon, normalizedQuery));
    return {
      active: matched.filter((coupon) => couponListStatus(coupon) === "active"),
      scheduled: matched.filter((coupon) => couponListStatus(coupon) === "scheduled"),
      expired: matched.filter((coupon) => couponListStatus(coupon) === "expired"),
      archived: matched.filter((coupon) => couponListStatus(coupon) === "archived"),
    };
  }, [rows, normalizedQuery]);

  const visible = grouped[tab];

  function copyCoupon(coupon: CouponRecord) {
    startTransition(async () => {
      const result = await duplicateCoupon(coupon.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Coupon copied. Set a new code if you want a public name.");
      if (result.id) router.push(`/coupons/${result.id}`);
    });
  }

  function unarchive(coupon: CouponRecord) {
    startTransition(async () => {
      const result = await setCouponArchived(coupon.id, false);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Coupon restored.");
        router.refresh();
      }
    });
  }

  const empty =
    rows.length === 0 ? (
      <EmptyState
        className="py-10"
        icon={<TicketPercent className="size-5" />}
        title="No coupons yet"
        description="Create a promotional code that later applies on top of the patient cart."
      />
    ) : visible.length === 0 ? (
      <EmptyState
        className="py-10"
        icon={normalizedQuery ? <SearchX className="size-5" /> : <TicketPercent className="size-5" />}
        title={normalizedQuery ? "No matching coupons" : TAB_COPY[tab].emptyTitle}
        description={
          normalizedQuery ? "Try a different name or code." : TAB_COPY[tab].emptyDescription
        }
      />
    ) : null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              id="coupon-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search coupons"
              aria-label="Search coupons"
              className="pl-9"
            />
          </div>
          {canEdit ? (
            <Button asChild className="shrink-0">
              <Link href="/coupons/new">
                <Plus />
                New coupon
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Coupon status">
          {STATUS_FILTERS.map((filter) => {
            const selected = tab === filter.id;
            return (
              <button
                key={filter.id}
                id={`coupon-status-${filter.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="coupon-status-panel"
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(filter.id)}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const current = STATUS_FILTERS.findIndex(({ id }) => id === filter.id);
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? STATUS_FILTERS.length - 1
                        : (current + (event.key === "ArrowRight" ? 1 : -1) + STATUS_FILTERS.length) %
                          STATUS_FILTERS.length;
                  const nextTab = STATUS_FILTERS[next];
                  if (!nextTab) return;
                  setTab(nextTab.id);
                  document.getElementById(`coupon-status-${nextTab.id}`)?.focus();
                }}
                className={cn(
                  "inline-flex h-8 items-center rounded-md border px-3 text-sm font-medium shadow-xs transition-colors",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {`${filter.label} (${grouped[filter.id].length})`}
              </button>
            );
          })}
        </div>

        <div id="coupon-status-panel" role="tabpanel" aria-labelledby={`coupon-status-${tab}`}>
          {empty ? (
            <div className="overflow-hidden rounded-lg border bg-card">{empty}</div>
          ) : (
            <CouponsTable
              coupons={visible}
              canEdit={canEdit}
              pending={pending}
              onCopy={copyCoupon}
              onArchive={setArchiveTarget}
              onUnarchive={unarchive}
            />
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this coupon?</AlertDialogTitle>
            <AlertDialogDescription>
              It will move to Archived coupons and will not apply at a future checkout. You can
              unarchive it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive/10 text-destructive hover:bg-destructive/20")}
              onClick={() => {
                if (!archiveTarget) return;
                startTransition(async () => {
                  const result = await setCouponArchived(archiveTarget.id, true);
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success("Coupon archived.");
                    setArchiveTarget(null);
                    router.refresh();
                  }
                });
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
