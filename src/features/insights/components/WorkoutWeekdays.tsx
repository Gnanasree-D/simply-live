import type { WorkoutByWeekday } from "@/core/insights/compute";
import { cn } from "@/lib/utils";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WorkoutWeekdays({
  data,
  totalWorkouts,
  totalMinutes,
}: {
  data: WorkoutByWeekday[];
  totalWorkouts: number;
  totalMinutes: number;
}) {
  if (totalWorkouts === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No workouts logged yet. Open Activity to log one.
      </p>
    );
  }

  // Reorder Mon-first
  const ordered = [...data.slice(1), data[0]];
  const maxCount = Math.max(...ordered.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex items-end gap-1.5 h-24">
        {ordered.map((d) => {
          const heightPct = (d.count / maxCount) * 100;
          return (
            <div
              key={d.weekday}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className={cn(
                  "w-full rounded-t-sm transition-colors",
                  d.count === 0 ? "bg-muted" : "bg-primary/70",
                )}
                style={{ height: `${Math.max(heightPct, 4)}%` }}
                title={`${DAY_LABELS[d.weekday]}: ${d.count} ${d.count === 1 ? "workout" : "workouts"}${d.minutes > 0 ? ` · ${d.minutes} min` : ""}`}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-1.5 mt-2">
        {ordered.map((d) => (
          <div
            key={d.weekday}
            className="flex-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {DAY_LABELS[d.weekday].slice(0, 3)}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        {totalWorkouts} {totalWorkouts === 1 ? "workout" : "workouts"} ·{" "}
        {totalMinutes} min across last 12 weeks
      </p>
    </div>
  );
}
