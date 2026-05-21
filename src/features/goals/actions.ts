import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";

export interface GoalState {
  ok?: boolean;
  error?: string;
}

const GoalFormSchema = z.object({
  title: z.string().trim().min(1, "Add a title"),
  description: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().nullable(),
  ),
  targetDate: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.date().optional(),
  ),
});

const UpdateGoalFormSchema = GoalFormSchema.extend({
  id: z.string().min(1),
});

export async function createGoal(
  _prev: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const parsed = GoalFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    targetDate: formData.get("targetDate"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const t = now();
  await getLocalDb().goals.add({
    id: genId(),
    title: parsed.data.title,
    description: parsed.data.description,
    targetDate: parsed.data.targetDate ?? null,
    status: "ACTIVE",
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function updateGoal(
  _prev: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const parsed = UpdateGoalFormSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description"),
    targetDate: formData.get("targetDate"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const db = getLocalDb();
  const goal = await db.goals.get(parsed.data.id);
  if (!goal) return { error: "Goal not found" };

  await db.goals.update(parsed.data.id, {
    title: parsed.data.title,
    description: parsed.data.description,
    targetDate: parsed.data.targetDate ?? null,
    updatedAt: now(),
  });
  return { ok: true };
}

export async function toggleGoalAchieved(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getLocalDb();
  const goal = await db.goals.get(id);
  if (!goal) return;
  await db.goals.update(id, {
    status: goal.status === "ACHIEVED" ? "ACTIVE" : "ACHIEVED",
    updatedAt: now(),
  });
}

export async function deleteGoal(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getLocalDb();
  // Scrub the goalId from any entries that reference it
  const refs = await db.entries
    .where("goalRefs")
    .equals(id)
    .toArray();
  for (const e of refs) {
    await db.entries.update(e.id, {
      goalRefs: e.goalRefs.filter((r) => r !== id),
      updatedAt: now(),
    });
  }
  await db.goals.delete(id);
}

/** Validate goal IDs exist locally; returns the subset that are real. */
export async function filterGoalIds(goalIds: string[]): Promise<string[]> {
  if (goalIds.length === 0) return [];
  const rows = await getLocalDb().goals.where("id").anyOf(goalIds).toArray();
  return rows.map((r) => r.id);
}
