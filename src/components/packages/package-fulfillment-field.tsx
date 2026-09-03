"use client";

import { FULFILLMENT_MODES, type FulfillmentMode } from "@/lib/package-fulfillment";
import { cn } from "@/lib/utils";

export function PackageFulfillmentField({
  value,
  canEdit,
  onChange,
}: {
  value: FulfillmentMode;
  canEdit: boolean;
  onChange: (mode: FulfillmentMode) => void;
}) {
  return (
    <fieldset className="space-y-3 md:col-span-2">
      <legend className="text-sm font-medium">How patients take this package</legend>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {FULFILLMENT_MODES.map((mode) => {
          const selected = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              disabled={!canEdit}
              onClick={() => onChange(mode.id)}
              className={cn(
                "rounded-xl border px-3 py-3 text-left transition-colors disabled:opacity-60",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "hover:bg-muted/50",
              )}
            >
              <span className="block text-sm font-medium">{mode.label}</span>
              <span className="text-muted-foreground mt-1 block text-xs leading-relaxed">
                {mode.description}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
