import { getLocalDb } from "@/lib/local-db";
import type { FoodEntry } from "@/core/entry/schema";
import { endOfDay, startOfDay } from "@/core/time/day";
import { materializeFood } from "./mappers";

export async function listFoodForDay(
  day: Date = new Date(),
): Promise<FoodEntry[]> {
  const rows = await getLocalDb()
    .entries.where("kind")
    .equals("FOOD")
    .toArray();
  return rows
    .filter(
      (r) => r.createdAt >= startOfDay(day) && r.createdAt <= endOfDay(day),
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(materializeFood);
}

export async function listRecentFood(limit = 50): Promise<FoodEntry[]> {
  const rows = await getLocalDb()
    .entries.where("kind")
    .equals("FOOD")
    .toArray();
  return rows
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
    .map(materializeFood);
}

export interface FoodSummary {
  totalToday: number;
  junkToday: number;
  caloriesToday: number;
  totalThisWeek: number;
  junkThisWeek: number;
  caloriesThisWeek: number;
}

export async function getFoodSummary(
  current: Date = new Date(),
): Promise<FoodSummary> {
  const today = await listFoodForDay(current);
  const weekStart = new Date(current);
  weekStart.setDate(current.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const weekRows = (
    await getLocalDb().entries.where("kind").equals("FOOD").toArray()
  ).filter(
    (r) => r.createdAt >= weekStart && r.createdAt <= endOfDay(current),
  );
  const weekJunk = weekRows.filter(
    (r) => (r.data as { isJunk?: boolean })?.isJunk === true,
  ).length;
  const weekCalories = weekRows.reduce(
    (sum, r) => sum + ((r.data as { calories?: number })?.calories ?? 0),
    0,
  );

  return {
    totalToday: today.length,
    junkToday: today.filter((f) => f.isJunk).length,
    caloriesToday: today.reduce((sum, f) => sum + (f.calories ?? 0), 0),
    totalThisWeek: weekRows.length,
    junkThisWeek: weekJunk,
    caloriesThisWeek: weekCalories,
  };
}
