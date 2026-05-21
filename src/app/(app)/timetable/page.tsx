"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { listBlocksForRange } from "@/features/blocks/queries";
import { WeekGrid } from "@/features/blocks/components/WeekGrid";
import {
  endOfDay,
  getWeekDays,
  startOfWeek,
  toInputDate,
} from "@/core/time/day";

function TimetableInner() {
  const params = useSearchParams();
  const dateParam = params.get("date");
  const refDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();

  const weekStart = startOfWeek(refDate);
  const weekDays = getWeekDays(weekStart);
  const weekEnd = endOfDay(weekDays[6]);

  const blocks = useLiveQuery(
    () => listBlocksForRange(weekStart, weekEnd),
    [weekStart.getTime(), weekEnd.getTime()],
  );

  if (blocks === undefined) return null;

  const now = new Date();
  const isCurrentWeek = now >= weekStart && now <= weekEnd;

  const prevWeek = new Date(weekStart);
  prevWeek.setDate(prevWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const rangeLabel = formatWeekRange(weekStart, weekDays[6]);

  return (
    <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-10">
      <header className="mb-6">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl">Timetable</h1>
          {!isCurrentWeek && (
            <Link
              href="/timetable"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Jump to this week
            </Link>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Link
            href={`/timetable?date=${toInputDate(prevWeek)}`}
            aria-label="Previous week"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="size-4" />
            Prev
          </Link>
          <span className="text-sm font-medium">{rangeLabel}</span>
          <Link
            href={`/timetable?date=${toInputDate(nextWeek)}`}
            aria-label="Next week"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Next
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </header>

      <WeekGrid weekDays={weekDays} blocks={blocks} />
    </main>
  );
}

export default function TimetablePage() {
  return (
    <Suspense fallback={null}>
      <TimetableInner />
    </Suspense>
  );
}

function formatWeekRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  if (sameYear) {
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}
