"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Megaphone, Plus, Search, SearchX } from "lucide-react";
import { duplicateBanner, setBannerArchived } from "@/actions/banners";
import { BannersTable } from "@/components/banners/banners-table";
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
import { bannerListStatus, type BannerListStatus } from "@/lib/banner-lifecycle";
import type { BannerRecord } from "@/lib/banner-queries";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { id: BannerListStatus; label: string }[] = [
  { id: "active", label: "Active banners" },
  { id: "scheduled", label: "Scheduled banners" },
  { id: "expired", label: "Expired banners" },
  { id: "archived", label: "Archived banners" },
];

const TAB_COPY: Record<BannerListStatus, { emptyTitle: string; emptyDescription: string }> = {
  active: {
    emptyTitle: "No active banners",
    emptyDescription: "Announcements that are currently in their validity window appear here.",
  },
  scheduled: {
    emptyTitle: "No scheduled banners",
    emptyDescription: "Announcements whose start date is still in the future will show here.",
  },
  expired: {
    emptyTitle: "No expired banners",
    emptyDescription: "Announcements whose end date has passed will move here automatically.",
  },
  archived: {
    emptyTitle: "No archived banners",
    emptyDescription: "Archive a banner from the menu when you no longer want it in the active list.",
  },
};

function matchesQuery(banner: BannerRecord, query: string) {
  if (!query) return true;
  const haystack = [banner.name, banner.headline, banner.body].join(" ").toLowerCase();
  return haystack.includes(query);
}

export function BannersCatalog({
  banners: rows,
  canEdit,
}: {
  banners: BannerRecord[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<BannerListStatus>("active");
  const [archiveTarget, setArchiveTarget] = useState<BannerRecord | null>(null);
  const [pending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();

  const grouped = useMemo(() => {
    const matched = rows.filter((banner) => matchesQuery(banner, normalizedQuery));
    return {
      active: matched.filter((banner) => bannerListStatus(banner) === "active"),
      scheduled: matched.filter((banner) => bannerListStatus(banner) === "scheduled"),
      expired: matched.filter((banner) => bannerListStatus(banner) === "expired"),
      archived: matched.filter((banner) => bannerListStatus(banner) === "archived"),
    };
  }, [rows, normalizedQuery]);

  const visible = grouped[tab];

  function copyBanner(banner: BannerRecord) {
    startTransition(async () => {
      const result = await duplicateBanner(banner.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Banner copied.");
      if (result.id) router.push(`/banners/${result.id}`);
    });
  }

  function unarchive(banner: BannerRecord) {
    startTransition(async () => {
      const result = await setBannerArchived(banner.id, false);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Banner restored.");
        router.refresh();
      }
    });
  }

  const empty =
    rows.length === 0 ? (
      <EmptyState
        className="py-10"
        icon={<Megaphone className="size-5" />}
        title="No banners yet"
        description="Create a festive, promotional, or lab announcement for the patient app home and inbox."
      />
    ) : visible.length === 0 ? (
      <EmptyState
        className="py-10"
        icon={normalizedQuery ? <SearchX className="size-5" /> : <Megaphone className="size-5" />}
        title={normalizedQuery ? "No matching banners" : TAB_COPY[tab].emptyTitle}
        description={
          normalizedQuery ? "Try a different name or headline." : TAB_COPY[tab].emptyDescription
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
              id="banner-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search banners"
              aria-label="Search banners"
              className="pl-9"
            />
          </div>
          {canEdit ? (
            <Button asChild className="shrink-0">
              <Link href="/banners/new">
                <Plus />
                New banner
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Banner status">
          {STATUS_FILTERS.map((filter) => {
            const selected = tab === filter.id;
            return (
              <button
                key={filter.id}
                id={`banner-status-${filter.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls="banner-status-panel"
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
                  document.getElementById(`banner-status-${nextTab.id}`)?.focus();
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

        <div id="banner-status-panel" role="tabpanel" aria-labelledby={`banner-status-${tab}`}>
          {empty ? (
            <div className="overflow-hidden rounded-lg border bg-card">{empty}</div>
          ) : (
            <BannersTable
              banners={visible}
              canEdit={canEdit}
              pending={pending}
              onCopy={copyBanner}
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
            <AlertDialogTitle>Archive this banner?</AlertDialogTitle>
            <AlertDialogDescription>
              It will move to Archived banners and will not appear on the patient app home or inbox.
              You can unarchive it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive/10 text-destructive hover:bg-destructive/20")}
              onClick={() => {
                if (!archiveTarget) return;
                startTransition(async () => {
                  const result = await setBannerArchived(archiveTarget.id, true);
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success("Banner archived.");
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
