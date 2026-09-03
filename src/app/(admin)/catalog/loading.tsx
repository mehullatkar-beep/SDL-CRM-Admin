import { Skeleton } from "@/components/ui/skeleton";
import { AdminPageBody } from "@/components/admin-page-body";

export default function CatalogLoading() {
  return (
    <AdminPageBody>
      <div aria-label="Loading catalog">
        <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="flex gap-3 border-b bg-muted/25 p-4">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-44" />
            <Skeleton className="h-9 w-44" />
          </div>
          <div className="space-y-0 divide-y">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="flex items-center gap-6 px-4 py-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminPageBody>
  );
}
