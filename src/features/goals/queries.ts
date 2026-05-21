import "server-only";
import { db } from "@/lib/db";
import type { Entry } from "@/core/entry/schema";
import { materializeJournal } from "@/features/journal/mappers";
import { materializeTodo } from "@/features/todos/mappers";

export interface GoalView {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalWithProgress extends GoalView {
  entryCount: number;
  lastActivity: Date | null;
}

export interface GoalPickerOption {
  id: string;
  title: string;
}

export async function listGoalsWithProgress(
  userId: string,
): Promise<GoalWithProgress[]> {
  const [goals, entries] = await Promise.all([
    db.goal.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    db.entry.findMany({
      where: { userId },
      select: { goalRefs: true, createdAt: true },
    }),
  ]);

  const stats = new Map<string, { count: number; lastActivity: Date | null }>();
  for (const g of goals) stats.set(g.id, { count: 0, lastActivity: null });
  for (const e of entries) {
    for (const goalId of e.goalRefs) {
      const s = stats.get(goalId);
      if (!s) continue;
      s.count++;
      if (!s.lastActivity || e.createdAt > s.lastActivity) {
        s.lastActivity = e.createdAt;
      }
    }
  }

  return goals.map((g) => {
    const s = stats.get(g.id)!;
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      status: g.status,
      targetDate: g.targetDate,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      entryCount: s.count,
      lastActivity: s.lastActivity,
    };
  });
}

export async function listActiveGoalsLight(
  userId: string,
): Promise<GoalPickerOption[]> {
  return db.goal.findMany({
    where: { userId, status: "ACTIVE" },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}

export interface GoalDetail {
  goal: GoalView;
  journals: ReturnType<typeof materializeJournal>[];
  todos: ReturnType<typeof materializeTodo>[];
  otherEntries: { id: string; kind: string; createdAt: Date }[];
}

export async function getGoalDetail(
  userId: string,
  id: string,
): Promise<GoalDetail | null> {
  const goal = await db.goal.findFirst({ where: { id, userId } });
  if (!goal) return null;

  const entries = await db.entry.findMany({
    where: { userId, goalRefs: { has: id } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const journals = entries
    .filter((e) => e.kind === "JOURNAL")
    .map(materializeJournal);
  const todos = entries
    .filter((e) => e.kind === "TODO")
    .map(materializeTodo);
  const otherEntries = entries
    .filter((e) => e.kind !== "JOURNAL" && e.kind !== "TODO")
    .map((e) => ({ id: e.id, kind: String(e.kind), createdAt: e.createdAt }));

  return {
    goal: {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      status: goal.status,
      targetDate: goal.targetDate,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    },
    journals,
    todos,
    otherEntries,
  };
}
