import { getLocalDb } from "@/lib/local-db";
import type { ActivityEntry } from "@/core/entry/schema";
import { endOfDay, startOfDay } from "@/core/time/day";
import { materializeActivity } from "./mappers";

export async function listActivityForDay(
  day: Date = new Date(),
): Promise<ActivityEntry[]> {
  const rows = await getLocalDb()
    .entries.where("kind")
    .equals("ACTIVITY")
    .toArray();
  return rows
    .filter((r) => r.createdAt >= startOfDay(day) && r.createdAt <= endOfDay(day))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(materializeActivity)
    .filter((a): a is ActivityEntry => a !== null);
}

export async function listRecentActivity(
  limit = 50,
): Promise<ActivityEntry[]> {
  const rows = await getLocalDb()
    .entries.where("kind")
    .equals("ACTIVITY")
    .toArray();
  return rows
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map(materializeActivity)
    .filter((a): a is ActivityEntry => a !== null);
}

export interface DailyActivitySummary {
  waterCups: number;
  steps: number;
  workoutMinutes: number;
  workoutCount: number;
}

export async function getDailyActivitySummary(
  day: Date = new Date(),
): Promise<DailyActivitySummary> {
  const entries = await listActivityForDay(day);
  let waterCups = 0;
  let steps = 0;
  let workoutMinutes = 0;
  let workoutCount = 0;
  for (const e of entries) {
    if (e.subtype === "water") waterCups += e.cups ?? 0;
    else if (e.subtype === "steps") steps = Math.max(steps, e.count ?? 0);
    else if (e.subtype === "workout") {
      workoutCount++;
      workoutMinutes += e.durationMins ?? 0;
    }
  }
  return { waterCups, steps, workoutMinutes, workoutCount };
}
