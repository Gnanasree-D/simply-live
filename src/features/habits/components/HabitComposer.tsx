"use client";

import { useActionState, useEffect, useRef } from "react";
import { createHabit, type HabitState } from "../actions";
import type { HabitCategoryView } from "../queries";
import { CadencePicker } from "./CadencePicker";

const initial: HabitState = {};

export function HabitComposer({
  categories,
}: {
  categories: HabitCategoryView[];
}) {
  const [state, action, pending] = useActionState(createHabit, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border border-border bg-card p-4 space-y-4"
    >
      <input
        name="title"
        type="text"
        required
        placeholder="What habit do you want to build?"
        className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
      />

      <CadencePicker />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Category</span>
          <select
            name="categoryId"
            defaultValue=""
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add habit"}
        </button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
