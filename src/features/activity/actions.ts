"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, endOfDay } from "@/core/time/day";

export interface ActivityState {
  ok?: boolean;
  error?: string;
}

const WorkoutSchema = z.object({
  title: z.string().trim().min(1, "Add a title"),
  durationMins: z.coerce.number().int().min(1).max(1440),
  notes: z.string().optional(),
});

const StepsSchema = z.object({
  count: z.coerce.number().int().min(0).max(200000),
});

function revalidateActivity() {
  revalidatePath("/activity");
  revalidatePath("/today");
}

export async function logWater() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "ACTIVITY",
      data: { subtype: "water", cups: 1 },
      tags: [],
      goalRefs: [],
    },
  });
  revalidateActivity();
}

export async function logWorkout(
  _prev: ActivityState,
  formData: FormData,
): Promise<ActivityState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = WorkoutSchema.safeParse({
    title: formData.get("title"),
    durationMins: formData.get("durationMins"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.title?.[0] ??
        parsed.error.flatten().fieldErrors.durationMins?.[0] ??
        "Invalid workout",
    };
  }

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "ACTIVITY",
      data: {
        subtype: "workout",
        title: parsed.data.title,
        durationMins: parsed.data.durationMins,
        notes: parsed.data.notes,
      },
      tags: [],
      goalRefs: [],
    },
  });
  revalidateActivity();
  return { ok: true };
}

export async function setSteps(
  _prev: ActivityState,
  formData: FormData,
): Promise<ActivityState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = StepsSchema.safeParse({ count: formData.get("count") });
  if (!parsed.success) return { error: "Steps must be a non-negative number" };

  const now = new Date();
  const dayStart = startOfDay(now);
  const dayEnd = endOfDay(now);

  // Upsert by deleting today's existing step entries and creating a new one.
  const existing = await db.entry.findMany({
    where: {
      userId: session.user.id,
      kind: "ACTIVITY",
      createdAt: { gte: dayStart, lte: dayEnd },
    },
  });
  const existingStepIds = existing
    .filter((e) => (e.data as { subtype?: string })?.subtype === "steps")
    .map((e) => e.id);
  if (existingStepIds.length > 0) {
    await db.entry.deleteMany({ where: { id: { in: existingStepIds } } });
  }

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "ACTIVITY",
      data: { subtype: "steps", count: parsed.data.count },
      tags: [],
      goalRefs: [],
    },
  });
  revalidateActivity();
  return { ok: true };
}

export async function deleteActivity(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.entry.deleteMany({
    where: { id, userId: session.user.id, kind: "ACTIVITY" },
  });
  revalidateActivity();
}
