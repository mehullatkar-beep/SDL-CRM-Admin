import { isPrototypeMode } from "@/lib/env";

export function PrototypeBanner() {
  if (!isPrototypeMode()) return null;

  return (
    <div className="border-amber-200 bg-amber-50 text-amber-950 border-b px-4 py-2 text-center text-sm">
      Prototype for review — sample data and mock lab catalog. Not production or a live testing
      environment.
    </div>
  );
}
