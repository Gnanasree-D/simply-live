import { auth } from "@/lib/auth";
import { listGoalsWithProgress } from "@/features/goals/queries";
import { GoalComposer } from "@/features/goals/components/GoalComposer";
import { GoalCard } from "@/features/goals/components/GoalCard";
import { EmptyHint } from "@/components/EmptyHint";

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const goals = await listGoalsWithProgress(session.user.id);
  const active = goals.filter((g) => g.status === "ACTIVE");
  const achieved = goals.filter((g) => g.status === "ACHIEVED");

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl">Goals</h1>
          {goals.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {active.length} active · {achieved.length} achieved
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          What you're working toward. Tag journal entries and to-dos to track progress.
        </p>
      </header>

      <GoalComposer />

      <section className="mt-8 space-y-4">
        {active.length === 0 && achieved.length === 0 && (
          <EmptyHint>No goals yet. Add your first above.</EmptyHint>
        )}
        {active.map((goal) => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </section>

      {achieved.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Achieved · {achieved.length}
          </h2>
          <div className="space-y-4">
            {achieved.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
