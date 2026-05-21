import "server-only";
import { db } from "@/lib/db";
import { materializeJournal } from "@/features/journal/mappers";
import { materializeTodo } from "@/features/todos/mappers";
import { materializeBlock } from "@/features/blocks/mappers";
import { materializeActivity } from "@/features/activity/mappers";
import { materializeFood } from "@/features/food/mappers";
import type {
  ActivityEntry,
  GoalNoteEntry,
  HabitEntry,
} from "@/core/entry/schema";
import type { ExportBundle } from "@/core/export/bundle";

function materializeGoalNote(row: {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  goalRefs: string[];
  data: unknown;
}): GoalNoteEntry {
  const data = (row.data ?? {}) as { goalId?: string; body?: string };
  return {
    kind: "goal-note",
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    goalId: data.goalId ?? "",
    body: data.body ?? "",
  };
}

function materializeHabitEntry(row: {
  id: string;
  createdAt: Date;
  data: unknown;
}): HabitEntry | null {
  const data = (row.data ?? {}) as { habitId?: string; note?: string };
  if (!data.habitId) return null;
  return {
    kind: "habit",
    id: row.id,
    userId: "",
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    tags: [],
    goalRefs: [],
    habitId: data.habitId,
    completedAt: row.createdAt,
    note: data.note,
  };
}

export async function loadExportBundle(
  userId: string,
  userEmail: string,
): Promise<ExportBundle> {
  const [user, entries, goals, habits] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { email: true } }),
    db.entry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    db.goal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.habit.findMany({
      where: { userId },
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const journals = entries
    .filter((e) => e.kind === "JOURNAL")
    .map(materializeJournal);
  const todos = entries.filter((e) => e.kind === "TODO").map(materializeTodo);
  const blocks = entries.filter((e) => e.kind === "BLOCK").map(materializeBlock);
  const goalNotes = entries
    .filter((e) => e.kind === "GOAL_NOTE")
    .map(materializeGoalNote);

  const habitEntries = entries
    .filter((e) => e.kind === "HABIT")
    .map(materializeHabitEntry)
    .filter((h): h is HabitEntry => h !== null);

  const completionsByHabit = new Map<string, Date[]>();
  for (const he of habitEntries) {
    if (!completionsByHabit.has(he.habitId)) {
      completionsByHabit.set(he.habitId, []);
    }
    completionsByHabit.get(he.habitId)!.push(he.completedAt);
  }

  const activities = entries
    .filter((e) => e.kind === "ACTIVITY")
    .map(materializeActivity)
    .filter((a): a is ActivityEntry => a !== null);
  const foods = entries.filter((e) => e.kind === "FOOD").map(materializeFood);

  return {
    exportedAt: new Date(),
    userEmail: user?.email ?? userEmail,
    journals,
    todos,
    blocks,
    goalNotes,
    activities,
    foods,
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      targetDate: g.targetDate,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    })),
    habits: habits.map((h) => ({
      id: h.id,
      title: h.title,
      cadence: h.cadence,
      weekdays: h.weekdays,
      intervalDays: h.intervalDays,
      categoryName: h.category?.name ?? null,
      archived: h.archived,
      createdAt: h.createdAt,
      completions: completionsByHabit.get(h.id) ?? [],
    })),
  };
}

export interface ExportSummary {
  journals: number;
  todos: number;
  habits: number;
  goals: number;
  blocks: number;
  goalNotes: number;
  totalEntries: number;
}

export async function getExportSummary(userId: string): Promise<ExportSummary> {
  const [journals, todos, habits, goals, blocks, goalNotes] = await Promise.all([
    db.entry.count({ where: { userId, kind: "JOURNAL" } }),
    db.entry.count({ where: { userId, kind: "TODO" } }),
    db.habit.count({ where: { userId } }),
    db.goal.count({ where: { userId } }),
    db.entry.count({ where: { userId, kind: "BLOCK" } }),
    db.entry.count({ where: { userId, kind: "GOAL_NOTE" } }),
  ]);
  return {
    journals,
    todos,
    habits,
    goals,
    blocks,
    goalNotes,
    totalEntries: journals + todos + blocks + goalNotes,
  };
}
