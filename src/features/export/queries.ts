import { getLocalDb, type EntryRow } from "@/lib/local-db";
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

function materializeGoalNote(row: EntryRow): GoalNoteEntry {
  const data = (row.data ?? {}) as { goalId?: string; body?: string };
  return {
    kind: "goal-note",
    id: row.id,
    userId: "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    goalId: data.goalId ?? "",
    body: data.body ?? "",
  };
}

function materializeHabitEntry(row: EntryRow): HabitEntry | null {
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

export async function loadExportBundle(): Promise<ExportBundle> {
  const db = getLocalDb();
  const [entriesRaw, goalsRaw, habitsRaw, categoriesRaw] = await Promise.all([
    db.entries.toArray(),
    db.goals.toArray(),
    db.habits.toArray(),
    db.habitCategories.toArray(),
  ]);

  const entries = [...entriesRaw].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  const goals = [...goalsRaw].sort((a, b) => {
    if (a.status !== b.status) return a.status.localeCompare(b.status);
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const habits = [...habitsRaw].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
  );
  const catById = new Map(categoriesRaw.map((c) => [c.id, c]));

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
    userEmail: "",
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
      categoryName: h.categoryId ? catById.get(h.categoryId)?.name ?? null : null,
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

export async function getExportSummary(): Promise<ExportSummary> {
  const db = getLocalDb();
  const [entries, habitsCount, goalsCount] = await Promise.all([
    db.entries.toArray(),
    db.habits.count(),
    db.goals.count(),
  ]);
  const byKind = (k: EntryRow["kind"]) =>
    entries.filter((e) => e.kind === k).length;
  const journals = byKind("JOURNAL");
  const todos = byKind("TODO");
  const blocks = byKind("BLOCK");
  const goalNotes = byKind("GOAL_NOTE");
  return {
    journals,
    todos,
    habits: habitsCount,
    goals: goalsCount,
    blocks,
    goalNotes,
    totalEntries: journals + todos + blocks + goalNotes,
  };
}
