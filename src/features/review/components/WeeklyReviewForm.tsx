"use client";

import { useActionState } from "react";
import { createWeeklyReview, type ReviewState } from "../actions";

const initial: ReviewState = {};

interface PromptDef {
  label: string;
  name: string;
  hint?: string;
}

const PROMPTS: PromptDef[] = [
  {
    label: "What went well this week?",
    name: "wins",
    hint: "Small wins count too.",
  },
  {
    label: "What didn't go as planned?",
    name: "challenges",
    hint: "Be honest with yourself.",
  },
  {
    label: "What did you learn?",
    name: "lessons",
    hint: "What would you do differently?",
  },
  {
    label: "What's the focus for next week?",
    name: "focus",
    hint: "Pick 1–3 things, not 10.",
  },
];

export function WeeklyReviewForm() {
  const [state, action, pending] = useActionState(createWeeklyReview, initial);

  return (
    <form action={action} className="space-y-8">
      {PROMPTS.map((p) => (
        <Prompt key={p.name} {...p} />
      ))}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-border">
        {state.error && (
          <p className="text-sm text-destructive mr-auto">{state.error}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save review"}
        </button>
      </div>
    </form>
  );
}

function Prompt({ label, name, hint }: PromptDef) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block">
        <span className="font-serif text-lg text-foreground">{label}</span>
        {hint && (
          <span className="block text-xs text-muted-foreground italic mt-0.5">
            {hint}
          </span>
        )}
      </label>
      <textarea
        id={name}
        name={name}
        rows={4}
        placeholder="Reflect freely…"
        className="w-full resize-none rounded-lg border border-border bg-card p-3 focus:outline-none focus:ring-2 focus:ring-ring text-base leading-relaxed prose-paper placeholder:text-muted-foreground"
      />
    </div>
  );
}
