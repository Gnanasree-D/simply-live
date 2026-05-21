"use client";

import { useActionState, useEffect, useRef } from "react";
import { createTodo, type TodoState } from "../actions";

const initial: TodoState = {};

export function TodoComposer() {
  const [state, action, pending] = useActionState(createTodo, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <input
        name="title"
        type="text"
        required
        aria-label="To-do title"
        placeholder="What needs doing?"
        className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
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
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
