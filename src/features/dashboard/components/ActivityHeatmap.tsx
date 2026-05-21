import { cn } from "@/lib/utils";
import type { ActivityDay } from "../queries";

function intensity(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-primary/30";
  if (count <= 5) return "bg-primary/55";
  if (count <= 10) return "bg-primary/80";
  return "bg-primary";
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex gap-1.5">
        <div className="flex flex-col gap-1 shrink-0 text-[10px] text-muted-foreground">
          {DAY_LABELS.map((label, i) => (
            <div
              key={i}
              className="flex-1 flex items-center leading-none min-h-0"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="flex gap-1 flex-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1 flex-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={cn(
                    "aspect-square rounded-sm",
                    day.isFuture ? "bg-transparent" : intensity(day.count),
                  )}
                  title={
                    day.isFuture
                      ? ""
                      : `${day.date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}: ${day.count} ${day.count === 1 ? "entry" : "entries"}`
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground">
        <span>Less</span>
        <div className="size-3 rounded-sm bg-muted" />
        <div className="size-3 rounded-sm bg-primary/30" />
        <div className="size-3 rounded-sm bg-primary/55" />
        <div className="size-3 rounded-sm bg-primary/80" />
        <div className="size-3 rounded-sm bg-primary" />
        <span>More</span>
      </div>
    </div>
  );
}
