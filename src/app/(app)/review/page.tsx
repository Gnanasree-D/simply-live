"use client";

import { WeeklyReviewForm } from "@/features/review/components/WeeklyReviewForm";
import { getWeekDays, startOfWeek } from "@/core/time/day";

export default function ReviewPage() {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = getWeekDays(weekStart)[6];
  const rangeLabel = formatRange(weekStart, weekEnd);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Weekly review
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">
          The week of {rangeLabel}.
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          A quiet hour at the end of the week. Saved as a journal entry.
        </p>
      </header>

      <WeeklyReviewForm />
    </main>
  );
}

function formatRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${end.getFullYear()}`;
}
