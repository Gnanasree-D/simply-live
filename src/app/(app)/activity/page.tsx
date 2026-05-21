import { Dumbbell } from "lucide-react";
import { auth } from "@/lib/auth";
import {
  getDailyActivitySummary,
  listActivityForDay,
} from "@/features/activity/queries";
import { WaterButton } from "@/features/activity/components/WaterButton";
import { StepsForm } from "@/features/activity/components/StepsForm";
import { WorkoutComposer } from "@/features/activity/components/WorkoutComposer";
import { ActivityLog } from "@/features/activity/components/ActivityLog";
import { EmptyHint } from "@/components/EmptyHint";

export default async function ActivityPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const now = new Date();
  const [summary, entries] = await Promise.all([
    getDailyActivitySummary(session.user.id, now),
    listActivityForDay(session.user.id, now),
  ]);

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Physical activity
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">
          How your body moved today.
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">{dateLabel}</p>
      </header>

      <section className="mb-8 grid gap-3 sm:grid-cols-2">
        <WaterButton currentCups={summary.waterCups} />
        <StepsForm currentCount={summary.steps} />
      </section>

      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Workouts
        </h2>
        <WorkoutComposer />
        {summary.workoutCount > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">
              {summary.workoutCount}{" "}
              {summary.workoutCount === 1 ? "session" : "sessions"}
            </span>
            {" · "}
            <span className="tabular-nums">{summary.workoutMinutes}</span> min
            today
          </p>
        )}
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Today&rsquo;s log
        </h2>
        {entries.length === 0 ? (
          <EmptyHint>
            Nothing logged yet today.{" "}
            <Dumbbell className="inline size-3.5 mx-0.5 align-text-bottom" />{" "}
            log a workout, tap water, or set your step count.
          </EmptyHint>
        ) : (
          <ActivityLog entries={entries} />
        )}
      </section>
    </main>
  );
}
