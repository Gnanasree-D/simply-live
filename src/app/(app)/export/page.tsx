"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getExportSummary } from "@/features/export/queries";
import { ExportDownloadCard } from "@/features/export/components/ExportDownloadCard";

export default function ExportPage() {
  const summary = useLiveQuery(() => getExportSummary());
  if (summary === undefined) return null;

  const rows: { label: string; count: number }[] = [
    { label: "Habits", count: summary.habits },
    { label: "Goals", count: summary.goals },
  ];

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Export
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">
          A snapshot of how you&rsquo;re showing up.
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          Download a consistency report — your habits and goals visualized over
          the last twelve weeks.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-3">In this report</h2>
        <div className="rounded-lg border border-border bg-card divide-y divide-border">
          {rows.map((r) => (
            <div
              key={r.label}
              className="flex items-baseline justify-between px-5 py-3 text-sm"
            >
              <span>{r.label}</span>
              <span className="font-serif tabular-nums">{r.count}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl mb-3">Download</h2>
        <ExportDownloadCard />
      </section>
    </main>
  );
}
