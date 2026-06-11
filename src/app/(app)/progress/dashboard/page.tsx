"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDashboardData } from "@/features/dashboard/queries";
import { ActivityHeatmap } from "@/features/dashboard/components/ActivityHeatmap";
import { HabitSparkRow } from "@/features/dashboard/components/HabitSparkRow";
import { GoalActivityRow } from "@/features/dashboard/components/GoalActivityRow";
import { BodyTrendRows } from "@/features/dashboard/components/BodyTrendRows";
import { EmptyHint } from "@/components/EmptyHint";

export default function DashboardPage() {
  const data = useLiveQuery(() => getDashboardData());
  if (data === undefined) return null;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          The last twelve weeks at a glance · {data.totalEntries}{" "}
          {data.totalEntries === 1 ? "entry" : "entries"} all-time
        </p>
      </header>

      {data.totalEntries === 0 ? (
        <EmptyHint>
          Nothing to show yet. Come back after a few days of journaling, ticking
          habits, or finishing tasks.
        </EmptyHint>
      ) : (
        <>
          <section className="mb-10">
            <h2 className="font-serif text-xl mb-3">Activity</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Last 12 weeks · each column is a week, each cell a day · darker = more entries
            </p>
            <div className="rounded-lg border border-border bg-card p-5">
              <ActivityHeatmap days={data.activityDays} />
            </div>
          </section>

          {data.habits.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-xl mb-3">Habits</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Last 14 days · filled bar = done that day
              </p>
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {data.habits.map((h) => (
                  <HabitSparkRow key={h.id} habit={h} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-10">
            <h2 className="font-serif text-xl mb-3">Body</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Last 14 days · workouts, water, steps, food
            </p>
            <BodyTrendRows body={data.body} />
          </section>

          {data.goals.length > 0 && (
            <section className="mb-10">
              <h2 className="font-serif text-xl mb-3">Goals</h2>
              <p className="text-xs text-muted-foreground mb-3">
                Top {data.goals.length} by recent activity
              </p>
              <div className="rounded-lg border border-border bg-card divide-y divide-border">
                {data.goals.map((g) => (
                  <GoalActivityRow key={g.id} goal={g} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
