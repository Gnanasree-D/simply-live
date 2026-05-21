import "server-only";
import { db } from "@/lib/db";
import type { FoodEntry } from "@/core/entry/schema";
import { endOfDay, startOfDay } from "@/core/time/day";
import { materializeFood } from "./mappers";

export async function listFoodForDay(
  userId: string,
  day: Date = new Date(),
): Promise<FoodEntry[]> {
  const rows = await db.entry.findMany({
    where: {
      userId,
      kind: "FOOD",
      createdAt: { gte: startOfDay(day), lte: endOfDay(day) },
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(materializeFood);
}

export async function listRecentFood(
  userId: string,
  limit = 50,
): Promise<FoodEntry[]> {
  const rows = await db.entry.findMany({
    where: { userId, kind: "FOOD" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(materializeFood);
}

export interface FoodSummary {
  totalToday: number;
  junkToday: number;
  totalThisWeek: number;
  junkThisWeek: number;
}

export async function getFoodSummary(
  userId: string,
  now: Date = new Date(),
): Promise<FoodSummary> {
  const today = await listFoodForDay(userId, now);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const weekRows = await db.entry.findMany({
    where: {
      userId,
      kind: "FOOD",
      createdAt: { gte: weekStart, lte: endOfDay(now) },
    },
    select: { data: true },
  });
  const weekJunk = weekRows.filter(
    (r) => (r.data as { isJunk?: boolean })?.isJunk === true,
  ).length;

  return {
    totalToday: today.length,
    junkToday: today.filter((f) => f.isJunk).length,
    totalThisWeek: weekRows.length,
    junkThisWeek: weekJunk,
  };
}
