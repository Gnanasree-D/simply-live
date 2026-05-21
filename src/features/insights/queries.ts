import "server-only";
import { db } from "@/lib/db";
import { computeInsights, type InsightsResult } from "@/core/insights/compute";
import type { Mood } from "@/core/entry/schema";

export async function getInsights(userId: string): Promise<InsightsResult> {
  const [entries, habits, goals] = await Promise.all([
    db.entry.findMany({
      where: { userId },
      select: { kind: true, createdAt: true, tags: true, goalRefs: true, data: true },
      orderBy: { createdAt: "asc" },
      take: 5000,
    }),
    db.habit.findMany({
      where: { userId, archived: false },
      select: {
        id: true,
        createdAt: true,
        weekdays: true,
        intervalDays: true,
        cadence: true,
      },
    }),
    db.goal.findMany({
      where: { userId },
      select: { id: true, title: true, status: true },
    }),
  ]);

  const habitCompletions: { habitId: string; date: Date }[] = [];
  const goalEntries: { goalId: string; createdAt: Date }[] = [];
  const taggedEntries: { tags: string[] }[] = [];
  const journalMoods: (Mood | undefined)[] = [];
  const activities: {
    createdAt: Date;
    subtype: "workout" | "water" | "steps";
    durationMins?: number;
    cups?: number;
    count?: number;
  }[] = [];
  const foods: { createdAt: Date; isJunk: boolean }[] = [];

  for (const e of entries) {
    if (e.tags.length) taggedEntries.push({ tags: e.tags });
    for (const goalId of e.goalRefs) {
      goalEntries.push({ goalId, createdAt: e.createdAt });
    }
    if (e.kind === "HABIT") {
      const habitId = (e.data as { habitId?: string })?.habitId;
      if (habitId) habitCompletions.push({ habitId, date: e.createdAt });
    }
    if (e.kind === "JOURNAL") {
      const mood = (e.data as { mood?: Mood })?.mood;
      journalMoods.push(mood);
    }
    if (e.kind === "ACTIVITY") {
      const data = (e.data ?? {}) as {
        subtype?: string;
        durationMins?: number;
        cups?: number;
        count?: number;
      };
      if (
        data.subtype === "workout" ||
        data.subtype === "water" ||
        data.subtype === "steps"
      ) {
        activities.push({
          createdAt: e.createdAt,
          subtype: data.subtype,
          durationMins: data.durationMins,
          cups: data.cups,
          count: data.count,
        });
      }
    }
    if (e.kind === "FOOD") {
      const isJunk = !!(e.data as { isJunk?: boolean })?.isJunk;
      foods.push({ createdAt: e.createdAt, isJunk });
    }
  }

  return computeInsights({
    now: new Date(),
    habitCompletions,
    habits,
    taggedEntries,
    goalEntries,
    goals,
    journalMoods,
    activities,
    foods,
  });
}
