"use client";

import { useActionState, useEffect, useOptimistic, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { GoalWithProgress } from "../queries";
import {
  deleteGoal,
  toggleGoalAchieved,
  updateGoal,
  type GoalState,
} from "../actions";
import { SubmitIconButton } from "@/components/SubmitIconButton";
import { cn } from "@/lib/utils";
import { daysBetween, formatInlineDate, formatTargetDate, toInputDate } from "@/core/time/day";

const initial: GoalState = {};

function formatTarget(target: Date, now = new Date()): string {
  const diff = daysBetween(now, target);
  if (diff < 0) return `Past target (${formatTargetDate(target)})`;
  if (diff === 0) return "Target today";
  if (diff === 1) return "Target tomorrow";
  if (diff < 30) return `${diff} days to target`;
  return `Target ${formatTargetDate(target)}`;
}

function formatLastActivity(d: Date, now = new Date()): string {
  const diff = daysBetween(d, now);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
  return formatInlineDate(d, now);
}

export function GoalCard({ goal }: { goal: GoalWithProgress }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateGoal, initial);
  const achieved = goal.status === "ACHIEVED";
  const [optimisticAchieved, setOptimisticAchieved] = useOptimistic(
    achieved,
    (_state, next: boolean) => next,
  );

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  async function handleToggle(formData: FormData) {
    setOptimisticAchieved(!achieved);
    await toggleGoalAchieved(formData);
  }

  if (editing) {
    return (
      <article className="rounded-lg border border-border bg-card p-4">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={goal.id} />
          <input
            name="title"
            type="text"
            required
            defaultValue={goal.title}
            autoFocus
            className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
          />
          <textarea
            name="description"
            rows={2}
            defaultValue={goal.description ?? ""}
            placeholder="Why this matters (optional)"
            className="w-full resize-none border-0 bg-transparent focus:outline-none text-sm leading-relaxed placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">Target</span>
              <input
                name="targetDate"
                type="date"
                defaultValue={goal.targetDate ? toInputDate(goal.targetDate) : ""}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              />
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
        "rounded-lg border border-border bg-card p-4",
        optimisticAchieved && "opacity-60",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/goals/detail?id=${goal.id}`}
            className={cn(
              "font-serif text-lg leading-tight hover:underline underline-offset-4",
              optimisticAchieved && "line-through text-muted-foreground",
            )}
          >
            {goal.title}
          </Link>
          {goal.description && (
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {goal.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {goal.targetDate && <span>{formatTarget(goal.targetDate)}</span>}
            <span>
              {goal.entryCount} {goal.entryCount === 1 ? "entry" : "entries"}
            </span>
            {goal.lastActivity && (
              <span>· last activity {formatLastActivity(goal.lastActivity)}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit goal"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <form action={deleteGoal}>
            <input type="hidden" name="id" value={goal.id} />
            <SubmitIconButton
              icon={Trash2}
              ariaLabel="Delete goal"
              className="p-1 text-muted-foreground hover:text-destructive"
            />
          </form>
        </div>
      </header>
      <form action={handleToggle} className="mt-3">
        <input type="hidden" name="id" value={goal.id} />
        <button
          type="submit"
          className={cn(
            "text-xs rounded-md border px-3 py-1 transition-colors",
            optimisticAchieved
              ? "border-border bg-muted text-muted-foreground hover:text-foreground"
              : "border-primary text-primary hover:bg-primary hover:text-primary-foreground",
          )}
        >
          {optimisticAchieved ? "Mark as active" : "Mark as achieved"}
        </button>
      </form>
    </article>
  );
}
