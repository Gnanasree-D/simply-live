import { getLocalDb, type HabitRow } from "@/lib/local-db";
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

export async function listHabitsWithStreaks(): Promise<HabitWithStreak[]> {
  const db = getLocalDb();
  const [habits, categories, habitEntries] = await Promise.all([
    db.habits.where("archived").equals(0).toArray().catch(async () => {
      // Dexie doesn't index booleans cleanly; fallback to filter
      const all = await db.habits.toArray();
      return all.filter((h) => !h.archived);
    }),
    db.habitCategories.toArray(),
    db.entries.where("kind").equals("HABIT").toArray(),
  ]);

  habits.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  habitEntries.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const catById = new Map(categories.map((c) => [c.id, c]));
  const now = new Date();
  const byHabit = new Map<string, Date[]>();
  for (const e of habitEntries) {
    const habitId = (e.data as { habitId?: string })?.habitId;
    if (!habitId) continue;
    if (!byHabit.has(habitId)) byHabit.set(habitId, []);
    byHabit.get(habitId)!.push(e.createdAt);
  }

  return habits.map((h: HabitRow) => {
    const dates = byHabit.get(h.id) ?? [];
    const streak = computeStreak(dates, {
      now,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays ?? undefined,
    });
    const cat = h.categoryId ? catById.get(h.categoryId) ?? null : null;
    return {
      id: h.id,
      title: h.title,
      cadence: h.cadence,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays,
      category: cat ? { id: cat.id, name: cat.name } : null,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      doneToday: dates.some((d) => isSameDay(d, now)),
      expectedToday: isExpectedToday(h.weekdays, h.intervalDays, dates, now),
    };
  });
}

export async function listHabitCategories(): Promise<HabitCategoryView[]> {
  const rows = await getLocalDb().habitCategories.toArray();
  return rows
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((c) => ({ id: c.id, name: c.name }));
}
