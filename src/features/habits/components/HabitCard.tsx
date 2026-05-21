"use client";

import { useActionState, useEffect, useOptimistic, useState } from "react";
import { Circle, CircleCheck, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HabitCategoryView, HabitWithStreak } from "../queries";
import {
  deleteHabit,
  toggleHabitToday,
  updateHabit,
  type HabitState,
} from "../actions";
import { CadencePicker } from "./CadencePicker";
import { SubmitIconButton } from "@/components/SubmitIconButton";

const initial: HabitState = {};

const DAY_LABELS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatCadence(habit: HabitWithStreak): string | null {
  if (habit.intervalDays && habit.intervalDays >= 2) {
    return `Every ${habit.intervalDays} days`;
  }
  if (habit.weekdays.length === 0 || habit.weekdays.length === 7) return null;
  return [...habit.weekdays]
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS_SHORT[d])
    .join(", ");
}

export function HabitCard({
  habit,
  categories,
  showCategoryTag = false,
}: {
  habit: HabitWithStreak;
  categories: HabitCategoryView[];
  showCategoryTag?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateHabit, initial);
  const [optimisticDone, setOptimisticDone] = useOptimistic(
    habit.doneToday,
    (_state, next: boolean) => next,
  );

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  const Icon = optimisticDone ? CircleCheck : Circle;
  const cadenceLabel = formatCadence(habit);

  async function handleToggle(formData: FormData) {
    setOptimisticDone(!habit.doneToday);
    await toggleHabitToday(formData);
  }

  if (editing) {
    return (
      <article className="rounded-lg border border-border bg-card p-4">
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={habit.id} />
          <input
            name="title"
            type="text"
            required
            defaultValue={habit.title}
            autoFocus
            className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
          />

          <CadencePicker
            initialWeekdays={habit.weekdays}
            initialIntervalDays={habit.intervalDays}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">Category</span>
              <select
                name="categoryId"
                defaultValue={habit.category?.id ?? ""}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              >
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {pending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </article>
    );
  }

  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-lg border border-border bg-card p-4",
        !habit.expectedToday && "opacity-60",
      )}
    >
      <form action={handleToggle} className="shrink-0 mt-0.5">
        <input type="hidden" name="habitId" value={habit.id} />
        <button
          type="submit"
          aria-label={optimisticDone ? "Mark as not done" : "Mark as done"}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Icon className={cn("size-5", optimisticDone && "text-primary")} />
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p
            className="leading-relaxed text-foreground truncate"
            title={habit.title}
          >
            {habit.title}
          </p>
          {showCategoryTag && habit.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
              {habit.category.name}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2 flex-wrap text-xs">
          {cadenceLabel && (
            <span className="text-muted-foreground">{cadenceLabel}</span>
          )}
          {habit.currentStreak > 0 ? (
            <>
              {cadenceLabel && <span className="text-muted-foreground">·</span>}
              <span style={{ color: "var(--streak)" }}>
                {habit.currentStreak} day{habit.currentStreak === 1 ? "" : "s"}
              </span>
              {habit.longestStreak > habit.currentStreak && (
                <span className="text-muted-foreground">
                  · best {habit.longestStreak}
                </span>
              )}
            </>
          ) : (
            habit.longestStreak > 0 && (
              <>
                {cadenceLabel && <span className="text-muted-foreground">·</span>}
                <span className="text-muted-foreground">
                  best {habit.longestStreak} day{habit.longestStreak === 1 ? "" : "s"}
                </span>
              </>
            )
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit habit"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="size-3.5" />
        </button>
        <form action={deleteHabit}>
          <input type="hidden" name="id" value={habit.id} />
          <SubmitIconButton
            icon={Trash2}
            ariaLabel="Delete habit"
            className="p-1 text-muted-foreground hover:text-destructive"
          />
        </form>
      </div>
    </article>
  );
}
