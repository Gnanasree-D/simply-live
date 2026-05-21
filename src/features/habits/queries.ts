import "server-only";
import { db } from "@/lib/db";
import { computeStreak } from "@/core/streaks/compute";
import { daysBetween, isSameDay } from "@/core/time/day";

export interface HabitCategoryView {
  id: string;
  name: string;
}

export interface HabitWithStreak {
  id: string;
  title: string;
  cadence: "DAILY" | "WEEKLY" | "CUSTOM" | "EVERY_N_DAYS";
  weekdays: number[];
  intervalDays: number | null;
  category: HabitCategoryView | null;
  createdAt: Date;
  updatedAt: Date;
  currentStreak: number;
  longestStreak: number;
  doneToday: boolean;
  expectedToday: boolean;
}

function isExpectedToday(
  weekdays: number[],
  intervalDays: number | null,
  completions: Date[],
  now: Date,
): boolean {
  if (intervalDays && intervalDays >= 1) {
    if (completions.length === 0) return true;
    const latest = new Date(Math.max(...completions.map((d) => d.getTime())));
    if (isSameDay(latest, now)) return true;
    return daysBetween(latest, now) >= intervalDays;
  }
  const isDaily = weekdays.length === 0 || weekdays.length === 7;
  return isDaily || weekdays.includes(now.getDay());
}

export async function listHabitsWithStreaks(
  userId: string,
): Promise<HabitWithStreak[]> {
  const [habits, entries] = await Promise.all([
    db.habit.findMany({
      where: { userId, archived: false },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    db.entry.findMany({
      where: { userId, kind: "HABIT" },
      orderBy: { createdAt: "asc" },
      select: { id: true, createdAt: true, data: true },
    }),
  ]);

  const now = new Date();
  const byHabit = new Map<string, Date[]>();
  for (const e of entries) {
    const habitId = (e.data as { habitId?: string })?.habitId;
    if (!habitId) continue;
    if (!byHabit.has(habitId)) byHabit.set(habitId, []);
    byHabit.get(habitId)!.push(e.createdAt);
  }

  return habits.map((h) => {
    const dates = byHabit.get(h.id) ?? [];
    const streak = computeStreak(dates, {
      now,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays ?? undefined,
    });
    return {
      id: h.id,
      title: h.title,
      cadence: h.cadence,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays,
      category: h.category,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      doneToday: dates.some((d) => isSameDay(d, now)),
      expectedToday: isExpectedToday(h.weekdays, h.intervalDays, dates, now),
    };
  });
}

export async function listHabitCategories(
  userId: string,
): Promise<HabitCategoryView[]> {
  return db.habitCategory.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}
