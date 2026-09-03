"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/catalog";
import type { CatalogTest } from "@/lib/catalog-queries";
import { orderedSelectedTests } from "@/lib/package-summary";

export function PackageTestPicker({
  tests,
  selectedIds,
  canEdit,
  onChange,
}: {
  tests: CatalogTest[];
  selectedIds: string[];
  canEdit: boolean;
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selectedTests = useMemo(
    () => orderedSelectedTests(tests, selectedIds),
    [tests, selectedIds],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tests
      .filter((test) => !selectedIds.includes(test.id))
      .filter(
        (test) =>
          !q ||
          test.name.toLowerCase().includes(q) ||
          test.code.toLowerCase().includes(q) ||
          test.department.toLowerCase().includes(q) ||
          test.sampleType.toLowerCase().includes(q),
      );
  }, [tests, selectedIds, query]);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  function add(id: string) {
    if (selectedIds.includes(id)) return;
    onChange([...selectedIds, id]);
    setQuery("");
    setOpen(false);
  }

  function remove(id: string) {
    onChange(selectedIds.filter((item) => item !== id));
  }

  return (
    <div className="space-y-4">
      {canEdit ? (
        <div ref={rootRef} className="relative">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen((current) => !current)}
            className="h-9 w-full justify-between font-normal"
          >
            <span className="text-muted-foreground truncate">Search and add a test</span>
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
          {open ? (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
              <div className="p-2">
                <div className="relative">
                  <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    autoFocus
                    placeholder="Search name, code, or department"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
              </div>
              {matches.length === 0 ? (
                <p className="text-muted-foreground px-3 py-3 text-sm">No matching tests.</p>
              ) : (
                <ul className="max-h-64 overflow-y-auto py-1">
                  {matches.map((test) => (
                    <li key={test.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/70"
                        onClick={() => add(test.id)}
                      >
                        <Plus className="text-muted-foreground size-4 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{test.name}</span>
                            <span className="font-mono text-xs text-muted-foreground">{test.code}</span>
                          </span>
                          <span className="text-muted-foreground block text-xs">
                            {test.department} · {test.sampleType} · {formatMoney(test.listPrice)}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {selectedTests.length === 0 ? (
        <p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
          Add tests from the dropdown. Sequence does not matter — patients add the package as one cart item.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {selectedTests.map((test) => (
            <li key={test.id} className="flex items-center gap-3 px-3 py-2.5">
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{test.name}</span>
                  <span className="font-mono text-xs text-muted-foreground">{test.code}</span>
                </span>
                <span className="text-muted-foreground block text-xs">
                  {test.department} · {test.sampleType}
                </span>
              </span>
              <span className="text-sm font-medium tabular-nums">{formatMoney(test.listPrice)}</span>
              {canEdit ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => remove(test.id)}
                  aria-label={`Remove ${test.name}`}
                >
                  <X />
                </Button>
              ) : null}
            </li>
          ))}
          <li className="flex items-center justify-between bg-muted/30 px-3 py-2.5 text-sm">
            <span className="text-muted-foreground">Tests sum</span>
            <span className="font-medium tabular-nums">
              {formatMoney(selectedTests.reduce((sum, test) => sum + test.listPrice, 0))}
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}
