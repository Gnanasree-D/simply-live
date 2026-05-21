"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Dumbbell, Plus, X } from "lucide-react";
import { logWorkout, type ActivityState } from "../actions";

const initial: ActivityState = {};

export function WorkoutComposer() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(logWorkout, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state]);

  useEffect(() => {
    if (open) titleRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex items-center gap-3 rounded-lg border-2 border-dashed border-border px-5 py-4 hover:border-primary hover:bg-primary/[0.03] transition-all w-full"
      >
        <div className="flex items-center justify-center size-10 rounded-full bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Dumbbell className="size-5" aria-hidden="true" />
        </div>
        <div className="text-left flex-1">
          <p className="font-serif text-lg">Log a workout</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Running, lifting, yoga…
          </p>
        </div>
        <Plus
          className="size-5 text-muted-foreground group-hover:text-primary transition-colors"
          aria-hidden="true"
        />
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={action}
      className="rounded-lg border-2 border-primary bg-card p-5 space-y-3"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-lg">New workout</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cancel"
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
      <input
        ref={titleRef}
        name="title"
        type="text"
        required
        maxLength={80}
        placeholder="What did you do?"
        aria-label="Workout title"
        className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="uppercase tracking-wider">Duration</span>
          <input
            name="durationMins"
            type="number"
            min={1}
            max={1440}
            required
            placeholder="30"
            className="w-20 bg-transparent border-0 text-foreground focus:outline-none text-sm tabular-nums"
          />
          <span className="text-sm">min</span>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes (optional)"
        aria-label="Workout notes"
        className="w-full resize-none border-0 bg-transparent focus:outline-none text-sm leading-relaxed placeholder:text-muted-foreground/70"
      />
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
