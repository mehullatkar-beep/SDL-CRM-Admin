"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground flex min-h-dvh flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground max-w-md text-center text-sm">
          {error.message || "The catalog workspace could not finish this request."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
