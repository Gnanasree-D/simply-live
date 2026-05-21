"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalPickerOption } from "../queries";

export function GoalPicker({
  goals,
  initialSelected = [],
  name = "goalRefs",
}: {
  goals: GoalPickerOption[];
  initialSelected?: string[];
  name?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialSelected),
  );

  if (goals.length === 0) return null;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        Goals
      </span>
      {goals.map((g) => {
        const on = selected.has(g.id);
        return (
          <button
            key={g.id}
            type="button"
            onClick={() => toggle(g.id)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs transition-colors",
              on
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {on && <Check className="size-3" aria-hidden="true" />}
            {g.title}
          </button>
        );
      })}
    </div>
  );
}
