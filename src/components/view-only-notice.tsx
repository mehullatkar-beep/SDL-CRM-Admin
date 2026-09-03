import { Eye } from "lucide-react";

export function ViewOnlyNotice({
  children = "You have view-only access. Ask an administrator to make changes.",
}: {
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-muted/60 text-muted-foreground flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      <Eye className="size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
