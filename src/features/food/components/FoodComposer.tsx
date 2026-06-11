"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { createFood, type FoodState } from "../actions";

const initial: FoodState = {};
const MEALS: { value: string; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export function FoodComposer() {
  const [state, action, pending] = useActionState(createFood, initial);
  const [meal, setMeal] = useState<string>("");
  const [isJunk, setIsJunk] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setMeal("");
      setIsJunk(false);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border border-border bg-card p-4 space-y-3"
    >
      <input type="hidden" name="meal" value={meal} />
      <input type="hidden" name="isJunk" value={isJunk ? "on" : ""} />

      <div className="flex items-center gap-3">
        <Utensils
          className="size-5 text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <input
          name="name"
          type="text"
          required
          maxLength={120}
          aria-label="Food name"
          placeholder="What did you eat?"
          className="flex-1 min-w-0 border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
        />
        <div className="flex items-baseline gap-1 shrink-0">
          <input
            name="grams"
            type="number"
            min={1}
            max={5000}
            aria-label="Portion in grams (optional)"
            placeholder="g"
            title="Portion in grams — leave blank for a ~150 g estimate"
            className="w-14 border-0 bg-transparent text-right tabular-nums focus:outline-none text-sm placeholder:text-muted-foreground/50"
          />
          <span className="text-xs text-muted-foreground">g</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground mr-1">
          Meal
        </span>
        {MEALS.map((m) => {
          const on = meal === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMeal(on ? "" : m.value)}
              aria-pressed={on}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs transition-colors",
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIsJunk((v) => !v)}
          aria-pressed={isJunk}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
            isJunk
              ? "bg-destructive text-destructive-foreground border-destructive"
              : "border-border text-muted-foreground hover:bg-muted",
          )}
        >
          {isJunk ? "✓" : "○"} Junk food
        </button>
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
