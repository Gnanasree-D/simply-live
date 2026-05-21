import Link from "next/link";
import type { GoalMomentum } from "@/core/insights/compute";
import { cn } from "@/lib/utils";

const TREND_LABEL: Record<GoalMomentum["trend"], string> = {
  up: "↑ heating up",
  down: "↓ cooling",
  flat: "→ steady",
  new: "✦ new",
};

const TREND_COLOR: Record<GoalMomentum["trend"], string> = {
  up: "text-primary",
  down: "text-muted-foreground",
  flat: "text-muted-foreground",
  new: "text-primary",
};

export function GoalMomentumRow({ goal }: { goal: GoalMomentum }) {
  const max = Math.max(...goal.weeklyCounts, 1);
  return (
    <Link
      href={`/goals/detail?id=${goal.id}`}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className={cn(
              "text-sm truncate",
              goal.status === "ACTIVE"
                ? "text-foreground"
                : "text-muted-foreground",
            )}
          >
            {goal.title}
          </span>
          {goal.status !== "ACTIVE" && (
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {goal.status.toLowerCase()}
            </span>
          )}
        </div>
        <span
          className={cn(
            "text-xs font-mono",
            TREND_COLOR[goal.trend],
          )}
        >
          {TREND_LABEL[goal.trend]}
        </span>
      </div>
      <div className="flex items-end gap-1 h-8 shrink-0">
        {goal.weeklyCounts.map((n, i) => (
          <div
            key={i}
            className={cn(
              "w-2 rounded-sm",
              n > 0 ? "bg-primary/70" : "bg-muted",
            )}
            style={{ height: `${Math.max((n / max) * 100, 8)}%` }}
            title={`Week ${i + 1}: ${n} ${n === 1 ? "entry" : "entries"}`}
          />
        ))}
      </div>
      <div className="text-xs tabular-nums text-muted-foreground w-10 text-right shrink-0">
        {goal.total}
      </div>
    </Link>
  );
}
