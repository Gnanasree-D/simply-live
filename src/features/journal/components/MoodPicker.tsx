"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Mood } from "@/core/entry/schema";

const MOODS: { value: Mood; label: string }[] = [
  { value: "great", label: "Great" },
  { value: "good", label: "Good" },
  { value: "okay", label: "Okay" },
  { value: "low", label: "Low" },
  { value: "rough", label: "Rough" },
];

export function MoodPicker({
  name,
  initialValue = "",
}: {
  name: string;
  initialValue?: Mood | "";
}) {
  const [selected, setSelected] = useState<Mood | "">(initialValue);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="hidden" name={name} value={selected} />
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        Mood
      </span>
      <div className="flex flex-wrap gap-1">
        {MOODS.map((m) => {
          const active = selected === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setSelected(active ? "" : m.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-md border transition-colors",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted text-muted-foreground",
              )}
            >
              {active && <Check className="size-3" aria-hidden="true" />}
              {m.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
