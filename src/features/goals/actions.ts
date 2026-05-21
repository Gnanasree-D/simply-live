"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

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

  await db.goal.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      targetDate: parsed.data.targetDate ?? null,
      status: "ACTIVE",
    },
  });

  revalidatePath("/goals");
  revalidatePath("/today");
  return { ok: true };
}

export async function updateGoal(
  _prev: GoalState,
  formData: FormData,
): Promise<GoalState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

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

  const goal = await db.goal.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!goal) return { error: "Goal not found" };

  await db.goal.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      targetDate: parsed.data.targetDate ?? null,
    },
  });

  revalidatePath("/goals");
  revalidatePath(`/goals/${parsed.data.id}`);
  revalidatePath("/today");
  return { ok: true };
}

export async function toggleGoalAchieved(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const goal = await db.goal.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!goal) return;

  await db.goal.update({
    where: { id },
    data: { status: goal.status === "ACHIEVED" ? "ACTIVE" : "ACHIEVED" },
  });

  revalidatePath("/goals");
  revalidatePath(`/goals/${id}`);
  revalidatePath("/today");
}

export async function deleteGoal(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  // Scrub from any entries that reference this goal
  const entries = await db.entry.findMany({
    where: { userId: session.user.id, goalRefs: { has: id } },
    select: { id: true, goalRefs: true },
  });
  for (const e of entries) {
    await db.entry.update({
      where: { id: e.id },
      data: { goalRefs: { set: e.goalRefs.filter((ref) => ref !== id) } },
    });
  }

  await db.goal.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/goals");
  revalidatePath("/journal");
  revalidatePath("/todos");
  revalidatePath("/today");
  redirect("/goals");
}

/**
 * Validate a list of goal IDs against the user's own goals.
 * Returns the subset that actually exists & belongs to the user.
 */
export async function filterUserGoalIds(
  userId: string,
  goalIds: string[],
): Promise<string[]> {
  if (goalIds.length === 0) return [];
  const rows = await db.goal.findMany({
    where: { id: { in: goalIds }, userId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
