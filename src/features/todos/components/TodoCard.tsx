"use client";

import { useActionState, useEffect, useOptimistic, useState } from "react";
import { Circle, CircleCheck, Pencil, Trash2 } from "lucide-react";
import type { TodoEntry } from "@/core/entry/schema";
import { cn } from "@/lib/utils";
import { daysBetween, formatInlineDate, isSameDay, toInputDate } from "@/core/time/day";
import {
  deleteTodo,
  toggleTodoDone,
  updateTodo,
  type TodoState,
} from "../actions";
import { SubmitIconButton } from "@/components/SubmitIconButton";

const initial: TodoState = {};

function formatDue(
  due: Date,
  now = new Date(),
): { label: string; tone: "due" | "overdue" | "future" } {
  const diff = daysBetween(now, due);
  if (diff < 0) return { label: "Overdue", tone: "overdue" };
  if (isSameDay(due, now)) return { label: "Today", tone: "due" };
  if (diff === 1) return { label: "Tomorrow", tone: "future" };
  return { label: formatInlineDate(due, now), tone: "future" };
}

function formatAdded(createdAt: Date, now = new Date()): string {
  if (isSameDay(createdAt, now)) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(createdAt, yesterday)) return "Yesterday";
  return formatInlineDate(createdAt, now);
}

export function TodoCard({
  todo,
  showAdded = false,
}: {
  todo: TodoEntry;
  showAdded?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateTodo, initial);
  const [optimisticDone, setOptimisticDone] = useOptimistic(
    todo.done,
    (_state, next: boolean) => next,
  );

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  const due = todo.due ? formatDue(todo.due) : null;
  const Icon = optimisticDone ? CircleCheck : Circle;

  async function handleToggle(formData: FormData) {
    setOptimisticDone(!todo.done);
    await toggleTodoDone(formData);
  }

  if (editing) {
    return (
      <article className="rounded-lg border border-border bg-card p-4">
        <form action={action} className="space-y-3">
          <input type="hidden" name="id" value={todo.id} />
          {todo.goalRefs.map((g) => (
            <input key={g} type="hidden" name="goalRefs" value={g} />
          ))}
          <input
            name="title"
            type="text"
            required
            defaultValue={todo.title}
            autoFocus
            className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="uppercase tracking-wider">Due</span>
              <input
                name="due"
                type="date"
                defaultValue={todo.due ? toInputDate(todo.due) : ""}
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
        "flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors",
        optimisticDone && "opacity-60",
      )}
    >
      <form action={handleToggle} className="shrink-0 mt-0.5">
        <input type="hidden" name="id" value={todo.id} />
        <button
          type="submit"
          aria-label={optimisticDone ? "Mark as not done" : "Mark as done"}
          className="text-muted-foreground hover:text-primary transition-colors"
        >
          <Icon className={cn("size-5", optimisticDone && "text-primary")} />
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "leading-relaxed text-foreground",
            optimisticDone && "line-through text-muted-foreground",
          )}
        >
          {todo.title}
        </p>
        {(due || showAdded) && (
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs">
            {showAdded && (
              <span className="text-muted-foreground">
                Added {formatAdded(todo.createdAt)}
              </span>
            )}
            {due && showAdded && (
              <span className="text-muted-foreground/60">·</span>
            )}
            {due && (
              <span
                className={cn(
                  due.tone === "overdue" && "text-destructive",
                  due.tone === "due" && "text-primary",
                  due.tone === "future" && "text-muted-foreground",
                )}
              >
                Due {due.label}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit to-do"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Pencil className="size-3.5" />
        </button>
        <form action={deleteTodo}>
          <input type="hidden" name="id" value={todo.id} />
          <SubmitIconButton
            icon={Trash2}
            ariaLabel="Delete to-do"
            className="p-1 text-muted-foreground hover:text-destructive"
          />
        </form>
      </div>
    </article>
  );
}
