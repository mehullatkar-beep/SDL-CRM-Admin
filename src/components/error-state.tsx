import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function ErrorState({
  title,
  description,
  action,
  compact = false,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "border-destructive/20 bg-destructive/5 flex gap-3 rounded-xl border",
        compact ? "p-3" : "p-5",
        className,
      )}
    >
      <span className="bg-destructive/10 text-destructive flex size-8 shrink-0 items-center justify-center rounded-lg">
        <AlertCircle className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    </div>
  );
}
