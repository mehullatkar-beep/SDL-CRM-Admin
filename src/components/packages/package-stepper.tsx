"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PACKAGE_STEPS = [
  { id: "details", label: "Details" },
  { id: "tests", label: "Tests & pricing" },
  { id: "availability", label: "Availability" },
  { id: "branding", label: "Branding" },
] as const;

export function PackageStepper({
  current,
  onSelect,
  canSelect,
}: {
  current: number;
  onSelect: (index: number) => void;
  canSelect: (index: number) => boolean;
}) {
  return (
    <nav
      aria-label="Package steps"
      className="z-20 shrink-0 border-b bg-background px-4 py-3 sm:px-6"
    >
      <ol className="flex items-center gap-1 sm:gap-2">
        {PACKAGE_STEPS.map((step, index) => {
          const active = index === current;
          const complete = index < current;
          const selectable = canSelect(index);
          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2">
              <button
                type="button"
                disabled={!selectable}
                aria-current={active ? "step" : undefined}
                aria-label={`${step.label}${complete ? ", completed" : active ? ", current step" : ""}`}
                onClick={() => onSelect(index)}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors sm:px-2",
                  selectable ? "hover:bg-muted/70" : "cursor-not-allowed",
                  active && "bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    active && "bg-primary text-primary-foreground",
                    complete && "bg-primary/15 text-primary",
                    !active && !complete && "bg-muted text-muted-foreground",
                  )}
                >
                  {complete ? <Check className="size-3.5" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "hidden truncate text-sm sm:inline",
                    active ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </button>
              {index < PACKAGE_STEPS.length - 1 ? (
                <span
                  className={cn(
                    "hidden h-px min-w-4 flex-1 sm:block",
                    complete ? "bg-primary/40" : "bg-border",
                  )}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground mt-2 text-xs sm:hidden">
        Step {current + 1} of {PACKAGE_STEPS.length}: {PACKAGE_STEPS[current]?.label}
      </p>
    </nav>
  );
}
