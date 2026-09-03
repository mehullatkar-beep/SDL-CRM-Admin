import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon ? (
        <div className="bg-primary/10 text-primary mb-4 flex size-11 items-center justify-center rounded-xl">
          {icon}
        </div>
      ) : null}
      <h2 className="text-sm font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1.5 max-w-md text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
