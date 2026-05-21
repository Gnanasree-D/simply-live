"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createJournalEntry, type JournalState } from "../actions";
import { MoodPicker } from "./MoodPicker";
import { GoalPicker } from "@/features/goals/components/GoalPicker";
import type { GoalPickerOption } from "@/features/goals/queries";

const initial: JournalState = {};

export function JournalComposer({
  goals = [],
}: {
  goals?: GoalPickerOption[];
}) {
  const [state, action, pending] = useActionState(createJournalEntry, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setResetKey((k) => k + 1);
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border border-border bg-card p-5 space-y-4"
    >
      <textarea
        name="body"
        rows={4}
        required
        aria-label="Journal entry"
        placeholder="Capture a thought…"
        className="w-full resize-none border-0 bg-transparent focus:outline-none text-base leading-relaxed prose-paper placeholder:text-muted-foreground"
      />
      <MoodPicker key={`mood-${resetKey}`} name="mood" />
      {goals.length > 0 && (
        <GoalPicker key={`goals-${resetKey}`} goals={goals} />
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}
