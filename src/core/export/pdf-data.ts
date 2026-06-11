import type { ExportGoal, ExportHabit } from "./bundle";
import type { ActivityEntry, FoodEntry, TodoEntry } from "@/core/entry/schema";
import { computeStreak } from "@/core/streaks/compute";
import { isSameDay, startOfDay, todayKey } from "@/core/time/day";

const DAY_MS = 86_400_000;
const HEATMAP_WEEKS = 12;

export interface HabitHeatmapCell {
  date: Date;
  done: boolean;
  expected: boolean;
  inFuture: boolean;
}

export interface HabitReport {
  id: string;
  title: string;
  category: string | null;
  cadenceLabel: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  expectedDays: number;
  consistencyPct: number;
  weeks: HabitHeatmapCell[][];
}

export interface GoalWeekBar {
  weekStart: Date;
  count: number;
}

export interface MilestoneReport {
  id: string;
  title: string;
  done: boolean;
  due: Date | undefined;
  overdue: boolean;
  number: number;
  x: number;
  y: number;
}

export interface TreeReport {
  hasMilestones: boolean;
  done: number;
  total: number;
  progress: number;
  health: number;
  overdue: number;
  leafCount: number;
  flowerCount: number;
  fruitCount: number;
}

export interface GoalReport {
  id: string;
  title: string;
  status: ExportGoal["status"];
  description: string | null;
  targetDate: Date | null;
  total: number;
  thisWeek: number;
  weeks: GoalWeekBar[];
  weekMax: number;
  milestones: MilestoneReport[];
  pathD: string;
  startPoint: { x: number; y: number };
  goalPoint: { x: number; y: number };
  travelledD: string | null;
  tree: TreeReport;
}

export interface BodyDayCell {
  date: Date;
  workout: boolean;
  waterMl: number;
  steps: number;
  foodEntries: number;
  junkEntries: number;
}

export interface BodyReport {
  hasData: boolean;
  workouts: number;
  workoutMinutes: number;
  avgWaterMl: number;
  avgSteps: number;
  foodEntries: number;
  junkEntries: number;
  junkPct: number;
  days: BodyDayCell[];
  workoutsByWeekday: number[];
}

export function buildBodyReport(
  activities: ActivityEntry[],
  foods: FoodEntry[],
  now: Date,
  daysWindow = 14,
): BodyReport {
  const today = startOfDay(now);
  const days: BodyDayCell[] = [];
  const byKey = new Map<string, BodyDayCell>();
  for (let i = daysWindow - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const cell: BodyDayCell = {
      date: d,
      workout: false,
      waterMl: 0,
      steps: 0,
      foodEntries: 0,
      junkEntries: 0,
    };
    days.push(cell);
    byKey.set(todayKey(d), cell);
  }

  let workouts = 0;
  let workoutMinutes = 0;
  let waterTotal = 0;
  let waterDays = new Set<string>();
  let stepsByDay = new Map<string, number>();
  const workoutsByWeekday = Array(7).fill(0) as number[];

  for (const a of activities) {
    if (a.createdAt < startOfDay(new Date(today.getTime() - daysWindow * 86_400_000))) continue;
    if (a.subtype === "workout") {
      workouts++;
      workoutMinutes += a.durationMins ?? 0;
      workoutsByWeekday[a.createdAt.getDay()]++;
      const cell = byKey.get(todayKey(a.createdAt));
      if (cell) cell.workout = true;
    } else if (a.subtype === "water") {
      waterTotal += a.ml ?? 0;
      const k = todayKey(a.createdAt);
      waterDays.add(k);
      const cell = byKey.get(k);
      if (cell) cell.waterMl += a.ml ?? 0;
    } else if (a.subtype === "steps") {
      const k = todayKey(a.createdAt);
      const cur = stepsByDay.get(k) ?? 0;
      stepsByDay.set(k, Math.max(cur, a.count ?? 0));
      const cell = byKey.get(k);
      if (cell) cell.steps = Math.max(cell.steps, a.count ?? 0);
    }
  }

  let foodEntries = 0;
  let junkEntries = 0;
  for (const f of foods) {
    const cell = byKey.get(todayKey(f.createdAt));
    if (cell) {
      cell.foodEntries++;
      if (f.isJunk) cell.junkEntries++;
    }
    foodEntries++;
    if (f.isJunk) junkEntries++;
  }

  const avgWaterMl =
    waterDays.size === 0
      ? 0
      : Math.round(waterTotal / waterDays.size);
  const stepVals = Array.from(stepsByDay.values());
  const avgSteps =
    stepVals.length === 0
      ? 0
      : Math.round(stepVals.reduce((s, v) => s + v, 0) / stepVals.length);
  const junkPct = foodEntries === 0 ? 0 : (junkEntries / foodEntries) * 100;

  const hasData =
    workouts > 0 ||
    waterTotal > 0 ||
    stepVals.length > 0 ||
    foodEntries > 0;

  return {
    hasData,
    workouts,
    workoutMinutes,
    avgWaterMl,
    avgSteps,
    foodEntries,
    junkEntries,
    junkPct: Math.round(junkPct),
    days,
    workoutsByWeekday,
  };
}

const PDF_MAP_W = 800;
const PDF_MAP_H = 200;
const PDF_MAP_PAD = 60;
const PDF_TOP = 50;
const PDF_BOT = PDF_MAP_H - 50;
const PDF_MID = PDF_MAP_H / 2;

const TREE_MAX_LEAVES = 24;
const TREE_MAX_FLOWERS = 7;

function mondayAnchoredEndSunday(now: Date): Date {
  const today = startOfDay(now);
  const monIdx = (today.getDay() + 6) % 7;
  const endSunday = new Date(today);
  endSunday.setDate(today.getDate() + (6 - monIdx));
  endSunday.setHours(0, 0, 0, 0);
  return endSunday;
}

function formatCadence(habit: ExportHabit): string {
  if (habit.intervalDays && habit.intervalDays >= 1) {
    return `Every ${habit.intervalDays} day${habit.intervalDays === 1 ? "" : "s"}`;
  }
  if (habit.weekdays.length === 0 || habit.weekdays.length === 7) {
    return "Daily";
  }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return [...habit.weekdays].sort().map((d) => dayNames[d]).join(" · ");
}

function isExpectedOn(habit: ExportHabit, day: Date): boolean {
  if (habit.intervalDays && habit.intervalDays >= 1) {
    return true;
  }
  if (habit.weekdays.length === 0 || habit.weekdays.length === 7) {
    return true;
  }
  return habit.weekdays.includes(day.getDay());
}

export function buildHabitReport(habit: ExportHabit, now: Date): HabitReport {
  const today = startOfDay(now);
  const endSunday = mondayAnchoredEndSunday(now);
  const startMonday = new Date(endSunday);
  startMonday.setDate(endSunday.getDate() - (HEATMAP_WEEKS * 7 - 1));

  const completionsSet = new Set(habit.completions.map((c) => todayKey(c)));

  const flatCells: HabitHeatmapCell[] = [];
  const cursor = new Date(startMonday);
  let expectedInWindow = 0;
  let completedInWindow = 0;
  while (cursor <= endSunday) {
    const inFuture = cursor > today;
    const expected = !inFuture && isExpectedOn(habit, cursor);
    const done = completionsSet.has(todayKey(cursor));
    if (expected) expectedInWindow++;
    if (expected && done) completedInWindow++;
    flatCells.push({
      date: new Date(cursor),
      done,
      expected,
      inFuture,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  const weeks: HabitHeatmapCell[][] = [];
  for (let i = 0; i < flatCells.length; i += 7) {
    weeks.push(flatCells.slice(i, i + 7));
  }

  const streak = computeStreak(habit.completions, {
    now,
    weekdays: habit.weekdays,
    intervalDays: habit.intervalDays ?? undefined,
  });

  const consistencyPct =
    expectedInWindow > 0
      ? Math.round((completedInWindow / expectedInWindow) * 100)
      : 0;

  return {
    id: habit.id,
    title: habit.title,
    category: habit.categoryName,
    cadenceLabel: formatCadence(habit),
    currentStreak: streak.current,
    longestStreak: streak.longest,
    totalCompletions: habit.completions.length,
    expectedDays: expectedInWindow,
    consistencyPct,
    weeks,
  };
}

export interface EntryWithGoalRefs {
  createdAt: Date;
  goalRefs: string[];
}

function sortMilestonesForReport(todos: TodoEntry[]): TodoEntry[] {
  return [...todos].sort((a, b) => {
    const aDue = a.due?.getTime() ?? Number.POSITIVE_INFINITY;
    const bDue = b.due?.getTime() ?? Number.POSITIVE_INFINITY;
    if (aDue !== bDue) return aDue - bDue;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
}

function buildRoadmapGeometry(milestoneCount: number) {
  const N = milestoneCount + 2;
  const xStep = (PDF_MAP_W - 2 * PDF_MAP_PAD) / Math.max(1, N - 1);
  const points = Array.from({ length: N }, (_, i) => {
    if (i === 0 || i === N - 1) {
      return { x: PDF_MAP_PAD + i * xStep, y: PDF_MID };
    }
    return {
      x: PDF_MAP_PAD + i * xStep,
      y: i % 2 === 1 ? PDF_TOP : PDF_BOT,
    };
  });
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = (curr.x - prev.x) * 0.5;
    d += ` C ${prev.x + dx} ${prev.y}, ${curr.x - dx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return { points, d };
}

function computeTree(milestones: TodoEntry[], now: Date): TreeReport {
  const total = milestones.length;
  const done = milestones.filter((m) => m.done).length;
  const progress = total === 0 ? 0 : done / total;
  const overdue = milestones.filter(
    (m) =>
      !m.done &&
      m.due !== undefined &&
      m.due < now &&
      !isSameDay(m.due, now),
  ).length;
  const health = Math.max(20, 100 - Math.min(80, overdue * 20));
  const leafCount =
    total === 0
      ? 0
      : Math.min(
          TREE_MAX_LEAVES,
          Math.round(3 + progress * (TREE_MAX_LEAVES - 3)),
        );
  const flowerCount =
    progress >= 0.75
      ? Math.min(TREE_MAX_FLOWERS, Math.round((progress - 0.7) * 24))
      : 0;
  const fruitCount = progress >= 0.95 ? 3 : progress >= 0.85 ? 1 : 0;
  return {
    hasMilestones: total > 0,
    done,
    total,
    progress,
    health,
    overdue,
    leafCount,
    flowerCount,
    fruitCount,
  };
}

export function buildGoalReport(
  goal: ExportGoal,
  entries: EntryWithGoalRefs[],
  milestonesRaw: TodoEntry[],
  now: Date,
): GoalReport {
  const today = startOfDay(now);
  const monIdx = (today.getDay() + 6) % 7;
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - monIdx);
  thisWeekStart.setHours(0, 0, 0, 0);

  const earliestMonday = new Date(thisWeekStart);
  earliestMonday.setDate(thisWeekStart.getDate() - (HEATMAP_WEEKS - 1) * 7);

  const weekCounts = new Array(HEATMAP_WEEKS).fill(0);
  let total = 0;
  let thisWeek = 0;

  for (const e of entries) {
    if (!e.goalRefs.includes(goal.id)) continue;
    total++;
    if (e.createdAt >= thisWeekStart) thisWeek++;
    if (e.createdAt < earliestMonday) continue;
    const weekIdx = Math.floor(
      (e.createdAt.getTime() - earliestMonday.getTime()) / (7 * DAY_MS),
    );
    if (weekIdx >= 0 && weekIdx < HEATMAP_WEEKS) {
      weekCounts[weekIdx]++;
    }
  }

  const weeks: GoalWeekBar[] = weekCounts.map((count, i) => {
    const weekStart = new Date(earliestMonday);
    weekStart.setDate(earliestMonday.getDate() + i * 7);
    return { weekStart, count };
  });

  const weekMax = Math.max(1, ...weekCounts);

  const sortedMilestones = sortMilestonesForReport(milestonesRaw);
  const { points, d: pathD } = buildRoadmapGeometry(sortedMilestones.length);
  const milestones: MilestoneReport[] = sortedMilestones.map((m, i) => {
    const pt = points[i + 1];
    return {
      id: m.id,
      title: m.title,
      done: m.done,
      due: m.due,
      overdue:
        !m.done &&
        m.due !== undefined &&
        m.due < now &&
        !isSameDay(m.due, now),
      number: i + 1,
      x: pt.x,
      y: pt.y,
    };
  });
  const startPoint = points[0];
  const goalPoint = points[points.length - 1];

  const tree = computeTree(sortedMilestones, now);

  // Travelled path: from start to last-done milestone position (or goal if all done).
  let lastDoneIdx = -1;
  sortedMilestones.forEach((m, i) => {
    if (m.done) lastDoneIdx = i;
  });
  const walkerPtIdx =
    tree.total > 0 && tree.done === tree.total
      ? points.length - 1
      : lastDoneIdx === -1
        ? 0
        : lastDoneIdx + 1;
  const travelledD = buildTravelledPath(points, walkerPtIdx);

  return {
    id: goal.id,
    title: goal.title,
    status: goal.status,
    description: goal.description,
    targetDate: goal.targetDate,
    total,
    thisWeek,
    weeks,
    weekMax,
    milestones,
    pathD,
    startPoint,
    goalPoint,
    travelledD,
    tree,
  };
}

function buildTravelledPath(
  points: { x: number; y: number }[],
  upToIdx: number,
): string | null {
  if (upToIdx <= 0) return null;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i <= upToIdx; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const dx = (curr.x - prev.x) * 0.5;
    d += ` C ${prev.x + dx} ${prev.y}, ${curr.x - dx} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
}
