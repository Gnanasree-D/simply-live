import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";
import { endOfDay, startOfDay } from "@/core/time/day";

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

const WaterSchema = z.object({
  ml: z.coerce.number().int().min(0).max(20000),
});

export async function setWater(
  _prev: ActivityState,
  formData: FormData,
): Promise<ActivityState> {
  const parsed = WaterSchema.safeParse({ ml: formData.get("ml") });
  if (!parsed.success) return { error: "Water must be between 0 and 20000 ml" };

  const db = getLocalDb();
  const t = now();
  const dayStart = startOfDay(t);
  const dayEnd = endOfDay(t);
  const todays = (
    await db.entries.where("kind").equals("ACTIVITY").toArray()
  ).filter((e) => e.createdAt >= dayStart && e.createdAt <= dayEnd);
  const existingWaterIds = todays
    .filter((e) => (e.data as { subtype?: string })?.subtype === "water")
    .map((e) => e.id);
  if (existingWaterIds.length > 0) {
    await db.entries.bulkDelete(existingWaterIds);
  }
  await db.entries.add({
    id: genId(),
    kind: "ACTIVITY",
    data: { subtype: "water", ml: parsed.data.ml },
    tags: [],
    goalRefs: [],
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function logWorkout(
  _prev: ActivityState,
  formData: FormData,
): Promise<ActivityState> {
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
  const t = now();
  await getLocalDb().entries.add({
    id: genId(),
    kind: "ACTIVITY",
    data: {
      subtype: "workout",
      title: parsed.data.title,
      durationMins: parsed.data.durationMins,
      notes: parsed.data.notes,
    },
    tags: [],
    goalRefs: [],
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function setSteps(
  _prev: ActivityState,
  formData: FormData,
): Promise<ActivityState> {
  const parsed = StepsSchema.safeParse({ count: formData.get("count") });
  if (!parsed.success) return { error: "Steps must be a non-negative number" };

  const db = getLocalDb();
  const t = now();
  const dayStart = startOfDay(t);
  const dayEnd = endOfDay(t);
  const todays = (
    await db.entries.where("kind").equals("ACTIVITY").toArray()
  ).filter((e) => e.createdAt >= dayStart && e.createdAt <= dayEnd);
  const existingStepIds = todays
    .filter((e) => (e.data as { subtype?: string })?.subtype === "steps")
    .map((e) => e.id);
  if (existingStepIds.length > 0) {
    await db.entries.bulkDelete(existingStepIds);
  }
  await db.entries.add({
    id: genId(),
    kind: "ACTIVITY",
    data: { subtype: "steps", count: parsed.data.count },
    tags: [],
    goalRefs: [],
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function deleteActivity(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getLocalDb().entries.delete(id);
}
