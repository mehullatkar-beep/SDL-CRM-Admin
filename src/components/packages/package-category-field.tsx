"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { createPackageCategory } from "@/actions/packages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PackageCategoryField({
  value,
  options,
  canEdit,
  onChange,
}: {
  value: string;
  options: string[];
  canEdit: boolean;
  onChange: (category: string, created?: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((name) => name.toLowerCase().includes(q));
  }, [options, query]);

  const exact = options.some((name) => name.toLowerCase() === query.trim().toLowerCase());
  const canCreate = canEdit && query.trim().length >= 2 && !exact;

  async function create() {
    const name = query.trim();
    if (!canCreate || pending) return;
    setPending(true);
    try {
      const result = await createPackageCategory(name);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      onChange(result.name ?? name, true);
      setQuery("");
      setOpen(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="packageCategory">Category</Label>
      <div className="relative">
        <Button
          id="packageCategory"
          type="button"
          variant="outline"
          disabled={!canEdit}
          onClick={() => setOpen((current) => !current)}
          className="h-9 w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {value || "Select or create a category"}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
        {open ? (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
            <div className="p-2">
              <Input
                autoFocus
                placeholder="Search or type to create"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                disabled={!canEdit}
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/70"
                    onClick={() => {
                      onChange(name);
                      setQuery("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn("size-4", value === name ? "opacity-100" : "opacity-0")}
                    />
                    {name}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && !canCreate ? (
                <li className="text-muted-foreground px-3 py-2 text-sm">No categories yet.</li>
              ) : null}
              {canCreate ? (
                <li>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/70"
                    onClick={create}
                    disabled={pending}
                  >
                    <Plus className="size-4" />
                    Create “{query.trim()}”
                  </button>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
