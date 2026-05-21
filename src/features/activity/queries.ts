import "server-only";
import { db } from "@/lib/db";
import type { ActivityEntry } from "@/core/entry/schema";
import { endOfDay, startOfDay } from "@/core/time/day";
import { materializeActivity } from "./mappers";

export async function listActivityForDay(
  userId: string,
  day: Date = new Date(),
): Promise<ActivityEntry[]> {
  const rows = await db.entry.findMany({
    where: {
      userId,
      kind: "ACTIVITY",
      createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows
    .map(materializeActivity)
    .filter((a): a is ActivityEntry => a !== null);
}

export async function listRecentActivity(
  userId: string,
  limit = 50,
): Promise<ActivityEntry[]> {
  const rows = await db.entry.findMany({
    where: { userId, kind: "ACTIVITY" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows
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
  userId: string,
  day: Date = new Date(),
): Promise<DailyActivitySummary> {
  const entries = await listActivityForDay(userId, day);
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
