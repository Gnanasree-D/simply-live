import { getLocalDb } from "@/lib/local-db";
import { computeStreak } from "@/core/streaks/compute";
import { startOfDay, startOfWeek, todayKey } from "@/core/time/day";

export interface ActivityDay {
  date: Date;
  count: number;
  isFuture: boolean;
}

export interface HabitDashboardEntry {
  id: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  recentDays: { date: Date; done: boolean }[];
}

export interface GoalActivityEntry {
  id: string;
  title: string;
  status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
  total: number;
  thisWeek: number;
}

export interface BodyDay {
  date: Date;
  workout: boolean;
  workoutMinutes: number;
  waterCups: number;
  steps: number;
  foodEntries: number;
  junkEntries: number;
}

export interface BodySummary {
  days: BodyDay[];
  workoutDays: number;
  totalWorkoutMinutes: number;
  avgWaterCups: number;
  avgSteps: number;
  totalFood: number;
  totalJunk: number;
}

export interface DashboardData {
  activityDays: ActivityDay[];
  habits: HabitDashboardEntry[];
  goals: GoalActivityEntry[];
  body: BodySummary;
  totalEntries: number;
}

interface EntryRow {
  kind: "JOURNAL" | "TODO" | "HABIT" | "BLOCK" | "GOAL_NOTE" | "ACTIVITY" | "FOOD";
  createdAt: Date;
  goalRefs: string[];
  data: unknown;
}

export async function getDashboardData(): Promise<DashboardData> {
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
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const goals = allGoals;

  return {
    activityDays: buildActivityHeatmap(entries, 12),
    habits: buildHabitDashboards(habits, entries, 14),
    goals: buildGoalActivity(goals, entries),
    body: buildBodySummary(entries, 14),
    totalEntries: entries.length,
  };
}

function buildBodySummary(entries: EntryRow[], days: number): BodySummary {
  const byDay = new Map<string, BodyDay>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    d.setHours(0, 0, 0, 0);
    byDay.set(todayKey(d), {
      date: d,
      workout: false,
      workoutMinutes: 0,
      waterCups: 0,
      steps: 0,
      foodEntries: 0,
      junkEntries: 0,
    });
  }

  for (const e of entries) {
    const key = todayKey(e.createdAt);
    const day = byDay.get(key);
    if (!day) continue;

    if (e.kind === "ACTIVITY") {
      const data = (e.data ?? {}) as {
        subtype?: string;
        cups?: number;
        count?: number;
        durationMins?: number;
      };
      if (data.subtype === "water") {
        day.waterCups += data.cups ?? 0;
      } else if (data.subtype === "steps") {
        day.steps = Math.max(day.steps, data.count ?? 0);
      } else if (data.subtype === "workout") {
        day.workout = true;
        day.workoutMinutes += data.durationMins ?? 0;
      }
    } else if (e.kind === "FOOD") {
      day.foodEntries++;
      if ((e.data as { isJunk?: boolean })?.isJunk) day.junkEntries++;
    }
  }

  const arr = Array.from(byDay.values());
  const workoutDays = arr.filter((d) => d.workout).length;
  const totalWorkoutMinutes = arr.reduce((s, d) => s + d.workoutMinutes, 0);
  const waterDaysWithData = arr.filter((d) => d.waterCups > 0).length;
  const avgWaterCups =
    waterDaysWithData === 0
      ? 0
      : Math.round(
          (arr.reduce((s, d) => s + d.waterCups, 0) / waterDaysWithData) * 10,
        ) / 10;
  const stepDaysWithData = arr.filter((d) => d.steps > 0).length;
  const avgSteps =
    stepDaysWithData === 0
      ? 0
      : Math.round(
          arr.reduce((s, d) => s + d.steps, 0) / stepDaysWithData,
        );
  const totalFood = arr.reduce((s, d) => s + d.foodEntries, 0);
  const totalJunk = arr.reduce((s, d) => s + d.junkEntries, 0);

  return {
    days: arr,
    workoutDays,
    totalWorkoutMinutes,
    avgWaterCups,
    avgSteps,
    totalFood,
    totalJunk,
  };
}

function buildActivityHeatmap(
  entries: EntryRow[],
  weeksCount: number,
): ActivityDay[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    const key = todayKey(e.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = startOfDay(new Date());
  // Monday-anchored: find the Sunday at or after today
  const monIdx = (today.getDay() + 6) % 7;
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + (6 - monIdx));
  endSunday.setHours(0, 0, 0, 0);

  const startMonday = new Date(endSunday);
  startMonday.setDate(endSunday.getDate() - (weeksCount * 7 - 1));

  const days: ActivityDay[] = [];
  const cursor = new Date(startMonday);
  while (cursor <= endSunday) {
    days.push({
      date: new Date(cursor),
      count: counts.get(todayKey(cursor)) ?? 0,
      isFuture: cursor > today,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

interface HabitRow {
  id: string;
  title: string;
  weekdays: number[];
  intervalDays: number | null;
}

function buildHabitDashboards(
  habits: HabitRow[],
  entries: EntryRow[],
  days: number,
): HabitDashboardEntry[] {
  const habitDates = new Map<string, Set<string>>();
  const habitTimes = new Map<string, Date[]>();

  for (const e of entries) {
    if (e.kind !== "HABIT") continue;
    const habitId = (e.data as { habitId?: string })?.habitId;
    if (!habitId) continue;
    if (!habitDates.has(habitId)) habitDates.set(habitId, new Set());
    habitDates.get(habitId)!.add(todayKey(e.createdAt));
    if (!habitTimes.has(habitId)) habitTimes.set(habitId, []);
    habitTimes.get(habitId)!.push(e.createdAt);
  }

  const now = new Date();

  return habits.map((h) => {
    const dates = habitDates.get(h.id) ?? new Set<string>();
    const times = habitTimes.get(h.id) ?? [];

    const recentDays: { date: Date; done: boolean }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      recentDays.push({
        date: d,
        done: dates.has(todayKey(d)),
      });
    }

    const streak = computeStreak(times, {
      now,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays ?? undefined,
    });

    return {
      id: h.id,
      title: h.title,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      recentDays,
    };
  });
}

interface GoalRow {
  id: string;
  title: string;
  status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
}

function buildGoalActivity(
  goals: GoalRow[],
  entries: EntryRow[],
): GoalActivityEntry[] {
  const now = new Date();
  const weekStart = startOfWeek(now);

  const total = new Map<string, number>();
  const thisWeek = new Map<string, number>();
  for (const e of entries) {
    for (const goalId of e.goalRefs) {
      total.set(goalId, (total.get(goalId) ?? 0) + 1);
      if (e.createdAt >= weekStart) {
        thisWeek.set(goalId, (thisWeek.get(goalId) ?? 0) + 1);
      }
    }
  }

  return goals
    .map((g) => ({
      id: g.id,
      title: g.title,
      status: g.status,
      total: total.get(g.id) ?? 0,
      thisWeek: thisWeek.get(g.id) ?? 0,
    }))
    .filter((g) => g.total > 0)
    .sort((a, b) => b.thisWeek - a.thisWeek || b.total - a.total)
    .slice(0, 5);
}
