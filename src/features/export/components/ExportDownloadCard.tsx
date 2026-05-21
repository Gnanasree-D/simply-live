"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ExportDownloadCard() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      const match = cd?.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "simplylive.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <a
        href="/api/export"
        onClick={handleClick}
        aria-busy={pending}
        aria-disabled={pending}
        className={
          pending
            ? "group flex flex-col rounded-lg border border-border bg-card p-6 cursor-wait opacity-80"
            : "group flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
        }
      >
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-serif text-lg">
            Consistency Report (PDF)
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground group-hover:text-primary">
            {pending ? (
              <>
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                Generating…
              </>
            ) : (
              "Download"
            )}
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          A printable snapshot of how you&rsquo;re doing — a 12-week heatmap
          for every habit, weekly activity bars for every goal. Streaks, hit
          rates, totals.
        </p>
      </a>
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}. Try again in a moment.
        </p>
      )}
    </div>
  );
}
