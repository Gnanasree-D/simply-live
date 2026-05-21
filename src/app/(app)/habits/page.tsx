import { auth } from "@/lib/auth";
import {
  listHabitCategories,
  listHabitsWithStreaks,
  type HabitWithStreak,
} from "@/features/habits/queries";
import { HabitComposer } from "@/features/habits/components/HabitComposer";
import { HabitCard } from "@/features/habits/components/HabitCard";
import { CategoryManager } from "@/features/habits/components/CategoryManager";
import { ProgressBar } from "@/components/ProgressBar";
import { EmptyHint } from "@/components/EmptyHint";

interface Group {
  categoryName: string | null;
  habits: HabitWithStreak[];
}

function groupByCategory(habits: HabitWithStreak[]): Group[] {
  const buckets = new Map<string, Group>();
  for (const h of habits) {
    const key = h.category?.id ?? "__uncat__";
    if (!buckets.has(key)) {
      buckets.set(key, { categoryName: h.category?.name ?? null, habits: [] });
    }
    buckets.get(key)!.habits.push(h);
  }
  return [...buckets.values()].sort((a, b) => {
    if (a.categoryName === null) return 1;
    if (b.categoryName === null) return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });
}

export default async function HabitsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [habits, categories] = await Promise.all([
    listHabitsWithStreaks(session.user.id),
    listHabitCategories(session.user.id),
  ]);
  const doneToday = habits.filter((h) => h.doneToday).length;
  const groups = groupByCategory(habits);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl">Habits</h1>
          {habits.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {doneToday} / {habits.length} done today
            </span>
          )}
        </div>
        {habits.length > 0 ? (
          <ProgressBar
            value={doneToday}
            max={habits.length}
            className="mt-3"
          />
        ) : (
          <p className="text-muted-foreground text-sm mt-1">
            Small daily wins. One day at a time.
          </p>
        )}
      </header>

      <section className="mb-6">
        <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Categories
        </h2>
        <CategoryManager categories={categories} />
      </section>

      <HabitComposer categories={categories} />

      <section className="mt-8 space-y-8">
        {habits.length === 0 ? (
          <EmptyHint>No habits yet. Add your first one above.</EmptyHint>
        ) : (
          groups.map((group, idx) => (
            <div key={group.categoryName ?? `uncat-${idx}`}>
              <h3 className="font-serif text-lg mb-3 text-foreground">
                {group.categoryName ?? "Uncategorized"}
              </h3>
              <div className="space-y-3">
                {group.habits.map((habit) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    categories={categories}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
