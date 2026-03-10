"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Something went wrong!</h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        The puzzle engine encountered an unexpected error.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <RotateCcw className="h-4 w-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center rounded-lg border border-border bg-background px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
