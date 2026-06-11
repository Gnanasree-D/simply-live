import { getLocalDb } from "@/lib/local-db";
import { computeInsights, type InsightsResult } from "@/core/insights/compute";
import { readWaterMl } from "@/core/activity/water";
import type { Mood } from "@/core/entry/schema";

export async function getInsights(): Promise<InsightsResult> {
  const db = getLocalDb();
  const [allEntries, allHabits, allGoals] = await Promise.all([
    db.entries.toArray(),
    db.habits.toArray(),
    db.goals.toArray(),
  ]);
  const entries = [...allEntries].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const habits = allHabits
    .filter((h) => !h.archived)
    .map((h) => ({
      id: h.id,
      createdAt: h.createdAt,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays,
      cadence: h.cadence,
    }));
  const goals = allGoals.map((g) => ({
    id: g.id,
    title: g.title,
    status: g.status,
  }));

  const habitCompletions: { habitId: string; date: Date }[] = [];
  const goalEntries: { goalId: string; createdAt: Date }[] = [];
  const taggedEntries: { tags: string[] }[] = [];
  const journalMoods: (Mood | undefined)[] = [];
  const activities: {
    createdAt: Date;
    subtype: "workout" | "water" | "steps";
    durationMins?: number;
    ml?: number;
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
        ml?: number;
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
          ml: data.subtype === "water" ? readWaterMl(data) : undefined,
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
