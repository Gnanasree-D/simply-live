"use client";

import Link from "next/link";
import { ArrowRight, Droplet, Dumbbell, Footprints, Utensils } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { listJournalEntries } from "@/features/journal/queries";
import { JournalEntryCard } from "@/features/journal/components/JournalEntryCard";
import { listTodos } from "@/features/todos/queries";
import { TodoCard } from "@/features/todos/components/TodoCard";
import {
  listHabitCategories,
  listHabitsWithStreaks,
} from "@/features/habits/queries";
import { HabitCard } from "@/features/habits/components/HabitCard";
import { listActiveGoalsLight } from "@/features/goals/queries";
import { listBlocksForDay } from "@/features/blocks/queries";
import { getDailyActivitySummary } from "@/features/activity/queries";
import { listFoodForDay } from "@/features/food/queries";
import { ProgressBar } from "@/components/ProgressBar";
import { endOfDay, isSameDay, startOfDay, todayKey } from "@/core/time/day";
import { EmptyHint } from "@/components/EmptyHint";

export default function TodayPage() {
  const now = new Date();
  const since = startOfDay(now);
  const until = endOfDay(now);

  const todays = useLiveQuery(() => listJournalEntries({ since, until }));
  const allTodos = useLiveQuery(() => listTodos());
  const habits = useLiveQuery(() => listHabitsWithStreaks());
  const categories = useLiveQuery(() => listHabitCategories());
  const goals = useLiveQuery(() => listActiveGoalsLight());
  const blocks = useLiveQuery(() => listBlocksForDay(now));
  const activity = useLiveQuery(() => getDailyActivitySummary(now));
  const foods = useLiveQuery(() => listFoodForDay(now));

  if (
    todays === undefined ||
    allTodos === undefined ||
    habits === undefined ||
    categories === undefined ||
    goals === undefined ||
    blocks === undefined ||
    activity === undefined ||
    foods === undefined
  ) {
    return null;
  }

  const dayStart = startOfDay(now);
  const todaysTodos = allTodos.filter((t) => {
    if (t.goalRefs.length > 0) return false;
    if (isSameDay(t.createdAt, now)) return true;
    if (t.due) {
      if (isSameDay(t.due, now)) return true;
      if (!t.done && t.due < dayStart) return true;
    }
    return false;
  });
  const openTodos = todaysTodos.filter((t) => !t.done);
  const doneTodos = todaysTodos.filter((t) => t.done);
  const todaysHabits = habits.filter((h) => h.expectedToday);
  const habitsDone = todaysHabits.filter((h) => h.doneToday).length;
  const junkCount = foods.filter((f) => f.isJunk).length;
  const hasActivity =
    activity.waterCups > 0 ||
    activity.steps > 0 ||
    activity.workoutCount > 0;

  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          {todayKey(now)}
        </p>
        <h1 className="mt-2 font-serif text-4xl">{dateLabel}</h1>
      </header>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Timetable</h2>
          {blocks.length > 0 && (
            <Link
              href="/timetable"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {blocks.length} {blocks.length === 1 ? "block" : "blocks"}
              <ArrowRight className="size-3" />
            </Link>
          )}
        </div>
        {blocks.length === 0 ? (
          <EmptyHint>No blocks planned. Open Timetable to map out your day.</EmptyHint>
        ) : (
          <ol className="rounded-lg border border-border bg-card divide-y divide-border">
            {blocks.map((b) => (
              <li
                key={b.id}
                className="flex items-baseline gap-3 px-4 py-2.5 text-sm"
              >
                <span className="tabular-nums text-xs text-muted-foreground w-28 shrink-0">
                  {formatBlockTime(b.start)} – {formatBlockTime(b.end)}
                </span>
                <span className="text-foreground truncate">{b.title}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Journal</h2>
          {todays.length > 0 && (
            <span className="text-xs text-muted-foreground">{todays.length}</span>
          )}
        </div>
        {todays.length === 0 ? (
          <EmptyHint>Nothing yet today. Open Journal to capture a thought.</EmptyHint>
        ) : (
          <div className="space-y-4">
            {todays.map((entry) => (
              <JournalEntryCard key={entry.id} entry={entry} goals={goals} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">To-Do</h2>
          {todaysTodos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {doneTodos.length} / {todaysTodos.length} done
            </span>
          )}
        </div>
        {todaysTodos.length > 0 && (
          <ProgressBar
            value={doneTodos.length}
            max={todaysTodos.length}
            className="mb-4"
          />
        )}
        {todaysTodos.length === 0 ? (
          <EmptyHint>Nothing for today. Add a task on the To-Do page.</EmptyHint>
        ) : (
          <div className="space-y-3">
            {openTodos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} showAdded />
            ))}
            {doneTodos.map((todo) => (
              <TodoCard key={todo.id} todo={todo} showAdded />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Activity</h2>
          <Link
            href="/activity"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Open
            <ArrowRight className="size-3" />
          </Link>
        </div>
        {!hasActivity ? (
          <EmptyHint>
            Nothing logged yet today. Open Activity to drop a cup of water or
            log a workout.
          </EmptyHint>
        ) : (
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Droplet
                className="size-4 text-primary shrink-0"
                fill="currentColor"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-serif text-xl tabular-nums leading-none">
                  {activity.waterCups}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {activity.waterCups === 1 ? "cup" : "cups"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Footprints
                className="size-4 text-accent-foreground shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-serif text-xl tabular-nums leading-none">
                  {activity.steps.toLocaleString()}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  steps
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell
                className="size-4 text-primary shrink-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-serif text-xl tabular-nums leading-none">
                  {activity.workoutCount}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {activity.workoutCount === 1 ? "session" : "sessions"}
                  {activity.workoutMinutes > 0 && (
                    <> · {activity.workoutMinutes}m</>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Food</h2>
          <Link
            href="/food"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {foods.length > 0 ? (
              <>
                {foods.length} {foods.length === 1 ? "entry" : "entries"}
                {junkCount > 0 && (
                  <>
                    {" · "}
                    <span className="text-destructive">{junkCount} junk</span>
                  </>
                )}
              </>
            ) : (
              "Open"
            )}
            <ArrowRight className="size-3" />
          </Link>
        </div>
        {foods.length === 0 ? (
          <EmptyHint>
            Nothing logged yet today. Open Food to track meals and snacks.
          </EmptyHint>
        ) : (
          <ul className="rounded-lg border border-border bg-card divide-y divide-border">
            {foods.slice(0, 6).map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-3 px-4 py-2 text-sm"
              >
                <Utensils
                  className="size-3.5 text-muted-foreground shrink-0"
                  aria-hidden="true"
                />
                <span className="flex-1 min-w-0 truncate text-foreground">
                  {f.name}
                </span>
                {f.isJunk && (
                  <span className="text-[10px] uppercase tracking-wider rounded-full bg-destructive/15 text-destructive px-2 py-0.5 shrink-0">
                    Junk
                  </span>
                )}
                {f.meal && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground shrink-0">
                    {f.meal}
                  </span>
                )}
              </li>
            ))}
            {foods.length > 6 && (
              <li className="px-4 py-2 text-xs text-muted-foreground text-center">
                + {foods.length - 6} more
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Habits</h2>
          {todaysHabits.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {habitsDone} / {todaysHabits.length} done
            </span>
          )}
        </div>
        {todaysHabits.length > 0 && (
          <ProgressBar
            value={habitsDone}
            max={todaysHabits.length}
            className="mb-4"
          />
        )}
        {habits.length === 0 ? (
          <EmptyHint>No habits yet. Add one on the Habits page.</EmptyHint>
        ) : todaysHabits.length === 0 ? (
          <EmptyHint>Nothing scheduled for today. A quiet day.</EmptyHint>
        ) : (
          <div className="space-y-3">
            {todaysHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                categories={categories}
                showCategoryTag
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function formatBlockTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const period = h < 12 ? "AM" : "PM";
  const dh = h % 12 || 12;
  return `${dh}:${String(m).padStart(2, "0")} ${period}`;
}
