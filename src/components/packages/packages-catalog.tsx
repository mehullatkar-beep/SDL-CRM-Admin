"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, List, PackagePlus, Plus, Search, SearchX } from "lucide-react";
import { duplicatePackage, setPackageArchived } from "@/actions/packages";
import { PackageCard } from "@/components/packages/package-card";
import { PackagesTable } from "@/components/packages/packages-table";
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
import type { PackageListItem } from "@/lib/catalog-queries";
import { packageListStatus, type PackageListStatus } from "@/lib/package-lifecycle";
import { cn } from "@/lib/utils";

type CatalogView = "card" | "list";

const STATUS_FILTERS: { id: PackageListStatus; label: string }[] = [
  { id: "active", label: "Active packages" },
  { id: "expired", label: "Expired packages" },
  { id: "archived", label: "Archived packages" },
];

const TAB_COPY: Record<
  PackageListStatus,
  { emptyTitle: string; emptyDescription: string }
> = {
  active: {
    emptyTitle: "No active packages",
    emptyDescription: "Active packages appear here while they are within their validity window.",
  },
  expired: {
    emptyTitle: "No expired packages",
    emptyDescription: "Packages whose end date has passed will move here automatically.",
  },
  archived: {
    emptyTitle: "No archived packages",
    emptyDescription: "Archive a package from the menu when you no longer want it in the active list.",
  },
};

function matchesQuery(pkg: PackageListItem, query: string) {
  if (!query) return true;
  const haystack = [pkg.name, pkg.description, pkg.category, pkg.slug]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function PackagesCatalog({
  packages: rows,
  canEdit,
}: {
  packages: PackageListItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<PackageListStatus>("active");
  const [view, setView] = useState<CatalogView>("card");
  const [archiveTarget, setArchiveTarget] = useState<PackageListItem | null>(null);
  const [pending, startTransition] = useTransition();

  const normalizedQuery = query.trim().toLowerCase();

  const grouped = useMemo(() => {
    const matched = rows.filter((pkg) => matchesQuery(pkg, normalizedQuery));
    return {
      active: matched.filter((pkg) => packageListStatus(pkg) === "active"),
      expired: matched.filter((pkg) => packageListStatus(pkg) === "expired"),
      archived: matched.filter((pkg) => packageListStatus(pkg) === "archived"),
    };
  }, [rows, normalizedQuery]);

  const visible = grouped[tab];

  function preview() {
    toast.message("Preview is coming soon.");
  }

  function copyPackage(pkg: PackageListItem) {
    startTransition(async () => {
      const result = await duplicatePackage(pkg.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Package copied.");
      if (result.id) router.push(`/catalog/packages/${result.id}`);
    });
  }

  function unarchive(pkg: PackageListItem) {
    startTransition(async () => {
      const result = await setPackageArchived(pkg.id, false);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Package restored.");
        router.refresh();
      }
    });
  }

  const empty =
    rows.length === 0 ? (
      <EmptyState
        className="py-10"
        icon={<PackagePlus className="size-5" />}
        title="No packages yet"
        description="Create a bundle from master tests. Pricing and fulfillment stay on the admin overlay."
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/catalog/packages/new">New package</Link>
            </Button>
          ) : null
        }
      />
    ) : visible.length === 0 ? (
      <EmptyState
        className="py-10"
        icon={normalizedQuery ? <SearchX className="size-5" /> : <PackagePlus className="size-5" />}
        title={normalizedQuery ? "No matching packages" : TAB_COPY[tab].emptyTitle}
        description={
          normalizedQuery
            ? "Try a different name, category, or description."
            : TAB_COPY[tab].emptyDescription
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
              id="package-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search packages"
              aria-label="Search packages"
              className="pl-9"
            />
          </div>
          {canEdit ? (
            <Button asChild className="shrink-0">
              <Link href="/catalog/packages/new">
                <Plus />
                New package
              </Link>
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Package status">
            {STATUS_FILTERS.map((filter) => {
              const selected = tab === filter.id;
              return (
                <button
                  key={filter.id}
                  id={`package-status-${filter.id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="package-status-panel"
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
                    document.getElementById(`package-status-${nextTab.id}`)?.focus();
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
          <div className="inline-flex w-fit rounded-md border p-0.5">
            <Button
              type="button"
              size="icon-sm"
              variant={view === "card" ? "secondary" : "ghost"}
              aria-pressed={view === "card"}
              aria-label="Show as cards"
              onClick={() => setView("card")}
            >
              <LayoutGrid />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant={view === "list" ? "secondary" : "ghost"}
              aria-pressed={view === "list"}
              aria-label="Show as list"
              onClick={() => setView("list")}
            >
              <List />
            </Button>
          </div>
        </div>

        <div
          id="package-status-panel"
          role="tabpanel"
          aria-labelledby={`package-status-${tab}`}
        >
        {empty ? (
          <div className="overflow-hidden rounded-lg border bg-card">{empty}</div>
        ) : view === "card" ? (
          <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visible.map((pkg) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                canEdit={canEdit}
                pending={pending}
                onPreview={preview}
                onCopy={() => copyPackage(pkg)}
                onArchive={() => setArchiveTarget(pkg)}
                onUnarchive={() => unarchive(pkg)}
              />
            ))}
          </div>
        ) : (
          <PackagesTable
            packages={visible}
            canEdit={canEdit}
            pending={pending}
            onPreview={preview}
            onCopy={copyPackage}
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
            <AlertDialogTitle>Archive this package?</AlertDialogTitle>
            <AlertDialogDescription>
              It will move to Archived packages and stay hidden from the future patient portal. You
              can unarchive it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={cn("bg-destructive/10 text-destructive hover:bg-destructive/20")}
              onClick={() => {
                if (!archiveTarget) return;
                startTransition(async () => {
                  const result = await setPackageArchived(archiveTarget.id, true);
                  if (result.error) toast.error(result.error);
                  else {
                    toast.success("Package archived.");
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
