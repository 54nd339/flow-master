import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted mb-6">
        <Gamepad2 className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">404</h1>
      <p className="text-lg text-muted-foreground mb-8">Grid not found. You might be out of bounds.</p>
      <Link
        href="/"
        className="rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Return to Menu
      </Link>
    </div>
  );
}
