import { cn } from "@/lib/utils";
import type { HabitDashboardEntry } from "../queries";

export function HabitSparkRow({ habit }: { habit: HabitDashboardEntry }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-sm text-foreground truncate flex-1 min-w-0">
        {habit.title}
      </span>
      <div className="flex gap-0.5 shrink-0">
        {habit.recentDays.map((day, i) => (
          <div
            key={i}
            className={cn(
              "w-1.5 h-4 rounded-[1px]",
              day.done ? "bg-primary" : "bg-muted",
            )}
            title={`${day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${day.done ? "done" : "missed"}`}
          />
        ))}
      </div>
      <div className="text-xs shrink-0 w-28 text-right">
        {habit.currentStreak > 0 ? (
          <span style={{ color: "var(--streak)" }} className="font-medium">
            {habit.currentStreak}d
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
        {habit.longestStreak > habit.currentStreak && (
          <span className="text-muted-foreground">
            {" "}
            · best {habit.longestStreak}
          </span>
        )}
      </div>
    </div>
  );
}
