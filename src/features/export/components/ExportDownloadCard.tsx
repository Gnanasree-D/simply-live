"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { loadExportBundle } from "../queries";
import {
  buildBodyReport,
  buildGoalReport,
  buildHabitReport,
  type EntryWithGoalRefs,
} from "@/core/export/pdf-data";
import { ConsistencyReport } from "../pdf";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function stamp(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

export function ExportDownloadCard() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const bundle = await loadExportBundle();
      const now = new Date();

      const habits = bundle.habits
        .filter((h) => !h.archived)
        .map((h) => buildHabitReport(h, now));

      const allEntries: EntryWithGoalRefs[] = [
        ...bundle.journals,
        ...bundle.todos,
        ...bundle.blocks,
        ...bundle.goalNotes,
      ];
      const milestonesByGoal = new Map<string, typeof bundle.todos>();
      for (const t of bundle.todos) {
        for (const ref of t.goalRefs) {
          const list = milestonesByGoal.get(ref) ?? [];
          list.push(t);
          milestonesByGoal.set(ref, list);
        }
      }
      const goals = bundle.goals.map((g) =>
        buildGoalReport(g, allEntries, milestonesByGoal.get(g.id) ?? [], now),
      );
      const body = buildBodyReport(bundle.activities, bundle.foods, now, 14);

      const blob = await pdf(
        ConsistencyReport({
          userEmail: bundle.userEmail,
          exportedAt: bundle.exportedAt,
          habits,
          goals,
          body,
        }),
      ).toBlob();

      const filename = `simplylive-${stamp(bundle.exportedAt)}.pdf`;
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
      <button
        type="button"
        onClick={handleClick}
        aria-busy={pending}
        disabled={pending}
        className={
          pending
            ? "group w-full text-left flex flex-col rounded-lg border border-border bg-card p-6 cursor-wait opacity-80"
            : "group w-full text-left flex flex-col rounded-lg border border-border bg-card p-6 transition-colors hover:border-primary"
        }
      >
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-serif text-lg">Consistency Report (PDF)</span>
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
          rates, totals. Generated entirely on your device.
        </p>
      </button>
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}. Try again in a moment.
        </p>
      )}
    </div>
  );
}
