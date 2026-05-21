"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getFoodSummary, listFoodForDay } from "@/features/food/queries";
import { FoodComposer } from "@/features/food/components/FoodComposer";
import { FoodCard } from "@/features/food/components/FoodCard";
import { EmptyHint } from "@/components/EmptyHint";

export default function FoodPage() {
  const summary = useLiveQuery(() => getFoodSummary(new Date()));
  const todays = useLiveQuery(() => listFoodForDay(new Date()));

  if (summary === undefined || todays === undefined) return null;

  const junkPctWeek =
    summary.totalThisWeek > 0
      ? Math.round((summary.junkThisWeek / summary.totalThisWeek) * 100)
      : 0;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Food vlog
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">
          What you fed yourself.
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          {summary.totalToday > 0 ? (
            <>
              <span className="font-medium text-foreground">
                {summary.totalToday}{" "}
                {summary.totalToday === 1 ? "entry" : "entries"}
              </span>{" "}
              today
              {summary.junkToday > 0 && (
                <>
                  {" · "}
                  <span className="text-destructive">
                    {summary.junkToday} junk
                  </span>
                </>
              )}
            </>
          ) : (
            <>Track meals and snacks. Mark junk food when it&rsquo;s junk.</>
          )}
        </p>
      </header>

      <FoodComposer />

      <section className="mt-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Today
        </h2>
        {todays.length === 0 ? (
          <EmptyHint>
            Nothing logged yet today. Add your first meal above.
          </EmptyHint>
        ) : (
          <div className="space-y-2">
            {todays.map((f) => (
              <FoodCard key={f.id} food={f} />
            ))}
          </div>
        )}
      </section>

      {summary.totalThisWeek > 0 && (
        <section className="mt-10 rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground">
            Last 7 days
          </h2>
          <div className="mt-2 flex items-baseline gap-3">
            <p className="font-serif text-2xl tabular-nums">
              {summary.totalThisWeek}
            </p>
            <p className="text-sm text-muted-foreground">
              entries logged
              {summary.junkThisWeek > 0 && (
                <>
                  {" · "}
                  <span className="text-destructive">
                    {summary.junkThisWeek} junk
                  </span>{" "}
                  <span className="tabular-nums">({junkPctWeek}%)</span>
                </>
              )}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
