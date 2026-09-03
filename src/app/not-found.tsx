import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-center text-sm">
        This route is not part of the SDL catalog workspace.
      </p>
      <Button asChild>
        <Link href="/catalog/tests">Go to catalog</Link>
      </Button>
    </main>
  );
}
