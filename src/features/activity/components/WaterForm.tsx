"use client";

import { useActionState, useEffect, useRef } from "react";
import { Droplet } from "lucide-react";
import { setWater, type ActivityState } from "../actions";

const initial: ActivityState = {};

export function WaterForm({ currentMl }: { currentMl: number }) {
  const [state, action, pending] = useActionState(setWater, initial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok && inputRef.current) inputRef.current.blur();
  }, [state]);

  return (
    <form
      action={action}
      className="flex items-center gap-3 rounded-lg border-2 border-border px-5 py-4 bg-card focus-within:border-primary transition-colors"
    >
      <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary shrink-0">
        <Droplet className="size-5" fill="currentColor" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1">
          <input
            ref={inputRef}
            name="ml"
            type="number"
            min={0}
            max={20000}
            step={50}
            defaultValue={currentMl > 0 ? currentMl : ""}
            placeholder="0"
            aria-label="Water today in ml"
            className="w-24 font-serif text-2xl tabular-nums bg-transparent border-0 focus:outline-none placeholder:text-muted-foreground/40"
          />
          <span className="text-xs text-muted-foreground">ml</span>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {pending ? "Saving…" : "Press enter to save"}
        </p>
        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="text-xs uppercase tracking-wider text-primary hover:underline disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
