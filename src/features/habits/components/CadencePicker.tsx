"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

type Mode = "weekdays" | "interval";

export function CadencePicker({
  initialWeekdays = [],
  initialIntervalDays,
}: {
  initialWeekdays?: number[];
  initialIntervalDays?: number | null;
}) {
  const startMode: Mode =
    initialIntervalDays && initialIntervalDays >= 2 ? "interval" : "weekdays";
  const [mode, setMode] = useState<Mode>(startMode);

  const initialDays =
    initialWeekdays.length === 0 ? ALL_DAYS : initialWeekdays;
  const [selected, setSelected] = useState<Set<number>>(new Set(initialDays));
  const [interval, setInterval] = useState<number>(
    initialIntervalDays && initialIntervalDays >= 2 ? initialIntervalDays : 2,
  );

  const allSelected = selected.size === 7;
  const noneSelected = selected.size === 0;

  function toggleDay(day: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name="cadenceMode" value={mode} />

      <div className="flex gap-1">
        <ModeTab
          active={mode === "weekdays"}
          onClick={() => setMode("weekdays")}
        >
          Specific days
        </ModeTab>
        <ModeTab
          active={mode === "interval"}
          onClick={() => setMode("interval")}
        >
          Every N days
        </ModeTab>
      </div>

      {mode === "weekdays" ? (
        <div className="flex items-center gap-2 flex-wrap">
          {Array.from(selected).map((d) => (
            <input key={d} type="hidden" name="weekdays" value={d} />
          ))}
          <div className="flex flex-wrap gap-1">
            {DAY_LABELS.map((label, i) => {
              const on = selected.has(i);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i)}
                  aria-pressed={on}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs transition-colors",
                    on
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {allSelected && (
            <span className="text-xs text-muted-foreground italic">Daily</span>
          )}
          {noneSelected && (
            <span className="text-xs text-destructive">Pick at least one</span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Every</span>
          <input
            name="intervalDays"
            type="number"
            min={1}
            max={365}
            value={interval}
            onChange={(e) => setInterval(Number(e.target.value) || 1)}
            className="w-16 rounded-md border border-border bg-card px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span>day{interval === 1 ? "" : "s"}</span>
        </div>
      )}
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-3 py-1 text-xs transition-colors",
        active
          ? "bg-muted text-foreground border-border"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
