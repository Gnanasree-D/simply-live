import { startOfDay, startOfWeek, todayKey } from "@/core/time/day";
import type { Mood } from "@/core/entry/schema";

const DAY_MS = 86_400_000;

export interface WeekdayConsistency {
  weekday: number;
  expected: number;
  done: number;
  rate: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface GoalMomentum {
  id: string;
  title: string;
  status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
  weeklyCounts: number[];
  total: number;
  trend: "up" | "down" | "flat" | "new";
}

export interface MoodSlice {
  mood: Mood;
  count: number;
}

export interface WorkoutByWeekday {
  weekday: number;
  count: number;
  minutes: number;
}

export interface BodyTrendWeek {
  weekStart: Date;
  waterAvg: number;
  stepsAvg: number;
  foodEntries: number;
  junkEntries: number;
  junkRatio: number;
}

export interface BodyInsights {
  workoutsByWeekday: WorkoutByWeekday[];
  totalWorkouts: number;
  totalWorkoutMinutes: number;
  weeks: BodyTrendWeek[];
  weeklyJunkRatio: number;
  totalFood: number;
  totalJunk: number;
}

export interface InsightInput {
  now: Date;
  habitCompletions: { habitId: string; date: Date }[];
  habits: {
    id: string;
    createdAt: Date;
    weekdays: number[];
    intervalDays: number | null;
    cadence: "DAILY" | "WEEKLY" | "CUSTOM" | "EVERY_N_DAYS";
  }[];
  taggedEntries: { tags: string[] }[];
  goalEntries: { goalId: string; createdAt: Date }[];
  goals: {
    id: string;
    title: string;
    status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
  }[];
  journalMoods: (Mood | undefined)[];
  activities: {
    createdAt: Date;
    subtype: "workout" | "water" | "steps";
    durationMins?: number;
    ml?: number;
    count?: number;
  }[];
  foods: { createdAt: Date; isJunk: boolean }[];
}

export interface InsightsResult {
  weekdayConsistency: WeekdayConsistency[];
  topTags: TagCount[];
  goalMomentum: GoalMomentum[];
  moodMix: MoodSlice[];
  totalMoodEntries: number;
  body: BodyInsights;
}

const MOOD_ORDER: Mood[] = ["great", "good", "okay", "low", "rough"];

export function computeInsights(input: InsightInput): InsightsResult {
  return {
    weekdayConsistency: computeWeekdayConsistency(input),
    topTags: computeTopTags(input.taggedEntries),
    goalMomentum: computeGoalMomentum(input),
    moodMix: computeMoodMix(input.journalMoods),
    totalMoodEntries: input.journalMoods.filter((m) => m !== undefined).length,
    body: computeBodyInsights(input),
  };
}

function computeBodyInsights(input: InsightInput): BodyInsights {
  const now = startOfDay(input.now);
  const windowDays = 84;
  const windowStart = new Date(now.getTime() - (windowDays - 1) * DAY_MS);

  const workoutsByWeekday: WorkoutByWeekday[] = Array.from(
    { length: 7 },
    (_, i) => ({ weekday: i, count: 0, minutes: 0 }),
  );
  let totalWorkouts = 0;
  let totalWorkoutMinutes = 0;

  for (const a of input.activities) {
    if (a.subtype !== "workout") continue;
    if (a.createdAt < windowStart || a.createdAt > input.now) continue;
    const wd = a.createdAt.getDay();
    workoutsByWeekday[wd].count++;
    workoutsByWeekday[wd].minutes += a.durationMins ?? 0;
    totalWorkouts++;
    totalWorkoutMinutes += a.durationMins ?? 0;
  }

  const weeksCount = 4;
  const currentWeekStart = startOfWeek(input.now);
  const weekStarts: Date[] = [];
  for (let i = weeksCount - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() - i * 7);
    weekStarts.push(d);
  }
  const trendStart = weekStarts[0];

  const buckets = weekStarts.map((start) => ({
    weekStart: start,
    waterTotal: 0,
    waterDays: new Set<string>(),
    stepsByDay: new Map<string, number>(),
    foodEntries: 0,
    junkEntries: 0,
  }));

  function weekIdx(d: Date): number {
    for (let i = weeksCount - 1; i >= 0; i--) {
      if (d >= weekStarts[i]) return i;
    }
    return -1;
  }

  for (const a of input.activities) {
    if (a.createdAt < trendStart) continue;
    const idx = weekIdx(a.createdAt);
    if (idx < 0) continue;
    const dayKey = todayKey(a.createdAt);
    if (a.subtype === "water") {
      buckets[idx].waterTotal += a.ml ?? 0;
      buckets[idx].waterDays.add(dayKey);
    } else if (a.subtype === "steps") {
      const cur = buckets[idx].stepsByDay.get(dayKey) ?? 0;
      buckets[idx].stepsByDay.set(dayKey, Math.max(cur, a.count ?? 0));
    }
  }

  for (const f of input.foods) {
    if (f.createdAt < trendStart) continue;
    const idx = weekIdx(f.createdAt);
    if (idx < 0) continue;
    buckets[idx].foodEntries++;
    if (f.isJunk) buckets[idx].junkEntries++;
  }

  const weeks: BodyTrendWeek[] = buckets.map((b) => {
    const waterAvg =
      b.waterDays.size === 0
        ? 0
        : Math.round(b.waterTotal / b.waterDays.size);
    const stepValues = Array.from(b.stepsByDay.values());
    const stepsAvg =
      stepValues.length === 0
        ? 0
        : Math.round(
            stepValues.reduce((s, v) => s + v, 0) / stepValues.length,
          );
    const junkRatio =
      b.foodEntries === 0 ? 0 : b.junkEntries / b.foodEntries;
    return {
      weekStart: b.weekStart,
      waterAvg,
      stepsAvg,
      foodEntries: b.foodEntries,
      junkEntries: b.junkEntries,
      junkRatio,
    };
  });

  const totalFood = weeks.reduce((s, w) => s + w.foodEntries, 0);
  const totalJunk = weeks.reduce((s, w) => s + w.junkEntries, 0);
  const weeklyJunkRatio = totalFood === 0 ? 0 : totalJunk / totalFood;

  return {
    workoutsByWeekday,
    totalWorkouts,
    totalWorkoutMinutes,
    weeks,
    weeklyJunkRatio,
    totalFood,
    totalJunk,
  };
}

function computeWeekdayConsistency(input: InsightInput): WeekdayConsistency[] {
  const now = startOfDay(input.now);
  const windowDays = 84;
  const windowStart = new Date(now.getTime() - (windowDays - 1) * DAY_MS);

  const completionsByHabit = new Map<string, Set<string>>();
  for (const c of input.habitCompletions) {
    if (c.date < windowStart || c.date > now) continue;
    if (!completionsByHabit.has(c.habitId)) {
      completionsByHabit.set(c.habitId, new Set());
    }
    completionsByHabit.get(c.habitId)!.add(todayKey(c.date));
  }

  const totals = Array.from({ length: 7 }, () => ({ expected: 0, done: 0 }));

  for (const habit of input.habits) {
    const habitStart = startOfDay(habit.createdAt);
    const effectiveStart = habitStart > windowStart ? habitStart : windowStart;
    if (effectiveStart > now) continue;

    const isDaily =
      habit.cadence === "DAILY" ||
      habit.weekdays.length === 0 ||
      habit.weekdays.length === 7;
    const interval = habit.intervalDays && habit.intervalDays >= 1
      ? habit.intervalDays
      : null;
    const done = completionsByHabit.get(habit.id) ?? new Set<string>();

    const cursor = new Date(effectiveStart);
    while (cursor <= now) {
      const wd = cursor.getDay();
      let expects = false;
      if (interval) {
        expects = true;
      } else if (isDaily) {
        expects = true;
      } else if (habit.cadence === "CUSTOM") {
        expects = habit.weekdays.includes(wd);
      }
      if (expects) {
        totals[wd].expected++;
        if (done.has(todayKey(cursor))) totals[wd].done++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return totals.map((t, wd) => ({
    weekday: wd,
    expected: t.expected,
    done: t.done,
    rate: t.expected === 0 ? 0 : t.done / t.expected,
  }));
}

function computeTopTags(
  entries: { tags: string[] }[],
  limit = 8,
): TagCount[] {
  const counts = new Map<string, number>();
  for (const e of entries) {
    for (const tag of e.tags) {
      const key = tag.trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}

function computeGoalMomentum(input: InsightInput): GoalMomentum[] {
  const weeks = 4;
  const now = input.now;
  const currentWeekStart = startOfWeek(now);

  const weekStarts: Date[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() - i * 7);
    weekStarts.push(d);
  }
  const windowStart = weekStarts[0];

  const byGoal = new Map<string, number[]>();
  for (const g of input.goals) byGoal.set(g.id, Array(weeks).fill(0));

  for (const e of input.goalEntries) {
    if (e.createdAt < windowStart) continue;
    const arr = byGoal.get(e.goalId);
    if (!arr) continue;
    for (let i = weeks - 1; i >= 0; i--) {
      if (e.createdAt >= weekStarts[i]) {
        arr[i]++;
        break;
      }
    }
  }

  return input.goals
    .map((g) => {
      const counts = byGoal.get(g.id) ?? Array(weeks).fill(0);
      const total = counts.reduce((s, n) => s + n, 0);
      const recent = counts[weeks - 1];
      const prior = counts.slice(0, weeks - 1).reduce((s, n) => s + n, 0);
      const priorAvg = prior / (weeks - 1);
      let trend: GoalMomentum["trend"];
      if (total === 0) trend = "flat";
      else if (prior === 0 && recent > 0) trend = "new";
      else if (recent > priorAvg * 1.25) trend = "up";
      else if (recent < priorAvg * 0.75) trend = "down";
      else trend = "flat";
      return {
        id: g.id,
        title: g.title,
        status: g.status,
        weeklyCounts: counts,
        total,
        trend,
      };
    })
    .filter((g) => g.total > 0 || g.status === "ACTIVE")
    .sort((a, b) => b.total - a.total || a.title.localeCompare(b.title));
}

function computeMoodMix(moods: (Mood | undefined)[]): MoodSlice[] {
  const counts = new Map<Mood, number>();
  for (const m of moods) {
    if (!m) continue;
    counts.set(m, (counts.get(m) ?? 0) + 1);
  }
  return MOOD_ORDER.map((mood) => ({
    mood,
    count: counts.get(mood) ?? 0,
  }));
}
