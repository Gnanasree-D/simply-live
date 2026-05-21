export default function Loading() {
  return (
    <main
      role="status"
      aria-busy="true"
      aria-label="Loading"
      className="flex-1 mx-auto w-full max-w-2xl px-6 py-10 animate-pulse"
    >
      <header className="mb-8">
        <div className="h-9 w-40 rounded-md bg-muted" />
        <div className="mt-3 h-4 w-64 rounded-md bg-muted/60" />
      </header>

      <div className="rounded-lg border border-border bg-card p-5">
        <div className="h-4 w-3/4 rounded bg-muted/70" />
        <div className="mt-3 h-3 w-1/2 rounded bg-muted/50" />
      </div>

      <div className="mt-6 space-y-3">
        <div className="h-20 rounded-lg border border-border bg-card" />
        <div className="h-20 rounded-lg border border-border bg-card" />
        <div className="h-20 rounded-lg border border-border bg-card" />
      </div>

      <span className="sr-only">Loading…</span>
    </main>
  );
}
