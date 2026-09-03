import { Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type StatusTone = "success" | "neutral" | "warning" | "outline";

const toneVariant = {
  success: "success",
  neutral: "secondary",
  warning: "warning",
  outline: "outline",
} as const;

export function StatusBadge({
  children,
  tone = "neutral",
  dot = true,
}: {
  children: React.ReactNode;
  tone?: StatusTone;
  dot?: boolean;
}) {
  return (
    <Badge variant={toneVariant[tone]} className="gap-1.5">
      {dot ? <Circle className="size-1.5! fill-current" /> : null}
      {children}
    </Badge>
  );
}
