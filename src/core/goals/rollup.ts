import type { Entry } from "@/core/entry/schema";

export interface GoalProgress {
  goalId: string;
  totalEntries: number;
  byKind: Record<string, number>;
  lastActivity: Date | null;
}

export function rollupGoal(goalId: string, entries: Entry[]): GoalProgress {
  const linked = entries.filter((e) => e.goalRefs.includes(goalId));
  const byKind: Record<string, number> = {};
  let lastActivity: Date | null = null;
  for (const e of linked) {
    byKind[e.kind] = (byKind[e.kind] ?? 0) + 1;
    if (!lastActivity || e.createdAt > lastActivity) lastActivity = e.createdAt;
  }
  return {
    goalId,
    totalEntries: linked.length,
    byKind,
    lastActivity,
  };
}
