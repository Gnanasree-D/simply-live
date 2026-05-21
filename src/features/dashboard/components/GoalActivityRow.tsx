import Link from "next/link";
import type { GoalActivityEntry } from "../queries";
import { cn } from "@/lib/utils";

export function GoalActivityRow({ goal }: { goal: GoalActivityEntry }) {
  const achieved = goal.status === "ACHIEVED";
  return (
    <Link
      href={`/goals/detail?id=${goal.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors"
    >
      <span
        className={cn(
          "text-sm flex-1 min-w-0 truncate",
          achieved
            ? "line-through text-muted-foreground"
            : "text-foreground",
        )}
      >
        {goal.title}
      </span>
      <span className="text-xs text-muted-foreground shrink-0 w-36 text-right">
        {goal.thisWeek > 0 && (
          <span className="text-foreground">{goal.thisWeek} this week · </span>
        )}
        {goal.total} total
      </span>
    </Link>
  );
}
