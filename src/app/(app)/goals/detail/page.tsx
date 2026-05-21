"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { getGoalDetail, listActiveGoalsLight } from "@/features/goals/queries";
import { JournalEntryCard } from "@/features/journal/components/JournalEntryCard";
import { MilestoneComposer } from "@/features/goals/components/MilestoneComposer";
import { GoalRoadmap } from "@/features/goals/components/GoalRoadmap";
import { GoalTree } from "@/features/goals/components/GoalTree";
import { daysBetween, formatTargetDate } from "@/core/time/day";
import { EmptyHint } from "@/components/EmptyHint";

function GoalDetailInner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";

  const detail = useLiveQuery(
    () => (id ? getGoalDetail(id) : Promise.resolve(null)),
    [id],
  );
  const goalsForPicker = useLiveQuery(() => listActiveGoalsLight());

  if (!id) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
        <Link
          href="/goals"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" /> Goals
        </Link>
        <EmptyHint>No goal selected.</EmptyHint>
      </main>
    );
  }
  if (detail === undefined || goalsForPicker === undefined) return null;
  if (detail === null) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
        <Link
          href="/goals"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="size-3.5" /> Goals
        </Link>
        <EmptyHint>This goal no longer exists.</EmptyHint>
      </main>
    );
  }

  const { goal, journals, todos, otherEntries } = detail;
  const achieved = goal.status === "ACHIEVED";

  const targetLabel = goal.targetDate
    ? (() => {
        const diff = daysBetween(new Date(), goal.targetDate);
        if (diff < 0)
          return `Past target (${formatTargetDate(goal.targetDate)})`;
        if (diff === 0) return "Target today";
        if (diff === 1) return "Target tomorrow";
        return `Target ${formatTargetDate(goal.targetDate)} · ${diff} days to go`;
      })()
    : null;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <Link
        href="/goals"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="size-3.5" /> Goals
      </Link>

      <header className="mb-8">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="font-serif text-3xl">{goal.title}</h1>
          {achieved && (
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Achieved
            </span>
          )}
        </div>
        {goal.description && (
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {goal.description}
          </p>
        )}
        {targetLabel && (
          <p className="mt-3 text-sm text-muted-foreground">{targetLabel}</p>
        )}
      </header>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Linked journal entries</h2>
          {journals.length > 0 && (
            <span className="text-xs text-muted-foreground">{journals.length}</span>
          )}
        </div>
        {journals.length === 0 ? (
          <EmptyHint>No journal entries tagged to this goal yet.</EmptyHint>
        ) : (
          <div className="space-y-4">
            {journals.map((entry) => (
              <JournalEntryCard
                key={entry.id}
                entry={entry}
                goals={goalsForPicker}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Your goal tree</h2>
          <span className="text-xs text-muted-foreground">
            Grows with progress
          </span>
        </div>
        <GoalTree todos={todos} />
      </section>

      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-serif text-xl">Roadmap</h2>
          <span className="text-xs text-muted-foreground">
            Steps to get there
          </span>
        </div>
        <div className="mb-4">
          <MilestoneComposer goalId={goal.id} />
        </div>
        {todos.length === 0 ? (
          <EmptyHint>
            No milestones yet. Add one above to start mapping the path.
          </EmptyHint>
        ) : (
          <GoalRoadmap todos={todos} />
        )}
      </section>

      {otherEntries.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl mb-3">Other linked entries</h2>
          <p className="text-xs text-muted-foreground">
            {otherEntries.length} habit check-ins and notes
          </p>
        </section>
      )}
    </main>
  );
}

export default function GoalDetailPage() {
  return (
    <Suspense fallback={null}>
      <GoalDetailInner />
    </Suspense>
  );
}
