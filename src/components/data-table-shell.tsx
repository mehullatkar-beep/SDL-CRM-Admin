import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DataTableShell({
  toolbar,
  children,
  className,
}: {
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-card shadow-xs", className)}>
      {toolbar ? <div className="border-b bg-muted/25 p-4">{toolbar}</div> : null}
      {children}
    </section>
  );
}
