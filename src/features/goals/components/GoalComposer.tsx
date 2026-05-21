"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createGoal, type GoalState } from "../actions";

const initial: GoalState = {};

export function GoalComposer() {
  const [state, action, pending] = useActionState(createGoal, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setExpanded(false);
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
        placeholder="What do you want to achieve?"
        onFocus={() => setExpanded(true)}
        className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
      />
      {expanded && (
        <textarea
          name="description"
          rows={2}
          placeholder="Why this matters (optional)"
          className="w-full resize-none border-0 bg-transparent focus:outline-none text-sm leading-relaxed placeholder:text-muted-foreground"
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Target</span>
          <input
            name="targetDate"
            type="date"
            className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add goal"}
        </button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
