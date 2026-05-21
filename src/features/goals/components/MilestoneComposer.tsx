"use client";

import { useActionState, useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { createTodo, type TodoState } from "@/features/todos/actions";

const initial: TodoState = {};

export function MilestoneComposer({ goalId }: { goalId: string }) {
  const [state, action, pending] = useActionState(createTodo, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      titleRef.current?.focus();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border border-border bg-card p-4"
    >
      <input type="hidden" name="goalRefs" value={goalId} />
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={titleRef}
          name="title"
          type="text"
          required
          aria-label="Milestone title"
          placeholder="Add a milestone…"
          className="flex-1 min-w-0 border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
          <span className="uppercase tracking-wider">Due</span>
          <input
            name="due"
            type="date"
            className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          aria-label="Add milestone"
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state.error && (
        <p className="mt-2 text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
