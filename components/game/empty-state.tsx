export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-muted">
        <svg viewBox="0 0 24 24" className="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <circle cx="4" cy="4" r="2" />
          <circle cx="20" cy="20" r="2" />
          <path d="M4 6v6c0 4 4 8 8 8h2c4 0 6-4 6-8V6" strokeLinecap="round" />
        </svg>
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">FlowMaster</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Generate numberlink puzzles up to 50&times;50. Press{" "}
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">N</kbd>{" "}
          or click Generate to start.
        </p>
      </div>
    </div>
  );
}
