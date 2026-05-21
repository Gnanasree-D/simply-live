import { auth } from "@/lib/auth";
import { listTodos } from "@/features/todos/queries";
import { TodoComposer } from "@/features/todos/components/TodoComposer";
import { TodoCard } from "@/features/todos/components/TodoCard";
import { ProgressBar } from "@/components/ProgressBar";
import { EmptyHint } from "@/components/EmptyHint";
import { isSameDay, startOfDay } from "@/core/time/day";

export default async function TodosPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const allTodos = await listTodos(session.user.id);
  // Milestones (todos linked to a goal) live on the goal detail page, not here.
  const todos = allTodos.filter((t) => t.goalRefs.length === 0);
  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const now = new Date();
  const dayStart = startOfDay(now);
  const todaysScope = todos.filter((t) => {
    if (isSameDay(t.createdAt, now)) return true;
    if (t.due) {
      if (isSameDay(t.due, now)) return true;
      if (!t.done && t.due < dayStart) return true;
    }
    return false;
  });
  const todayDone = todaysScope.filter((t) => t.done).length;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-baseline justify-between">
          <h1 className="font-serif text-3xl">To-Do</h1>
          {todaysScope.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {todayDone} / {todaysScope.length} done today
            </span>
          )}
        </div>
        {todaysScope.length > 0 ? (
          <ProgressBar
            value={todayDone}
            max={todaysScope.length}
            className="mt-3"
          />
        ) : (
          <p className="text-muted-foreground text-sm mt-1">
            What&rsquo;s on your plate
          </p>
        )}
      </header>

      <TodoComposer />

      <section className="mt-8 space-y-3">
        {open.length === 0 && done.length === 0 && (
          <EmptyHint>Nothing yet. Add your first task above.</EmptyHint>
        )}
        {open.map((todo) => (
          <TodoCard key={todo.id} todo={todo} showAdded />
        ))}
      </section>

      {done.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
            Done · {done.length}
          </h2>
          <div className="space-y-3">
            {done.map((todo) => (
              <TodoCard key={todo.id} todo={todo} showAdded />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
