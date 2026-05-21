import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";
import { endOfDay, startOfDay } from "@/core/time/day";

export interface HabitState {
  ok?: boolean;
  error?: string;
}

export interface CategoryState {
  ok?: boolean;
  error?: string;
}

function parseWeekdays(formData: FormData): number[] {
  const raw = formData.getAll("weekdays");
  const nums = raw
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  return Array.from(new Set(nums)).sort((a, b) => a - b);
}

function parseCadence(formData: FormData):
  | { mode: "weekdays"; weekdays: number[] }
  | { mode: "interval"; intervalDays: number }
  | { mode: "error"; error: string } {
  const cadenceMode = String(formData.get("cadenceMode") ?? "weekdays");
  if (cadenceMode === "interval") {
    const n = Number(formData.get("intervalDays"));
    if (!Number.isInteger(n) || n < 1 || n > 365) {
      return { mode: "error", error: "Interval must be between 1 and 365 days" };
    }
    return { mode: "interval", intervalDays: n };
  }
  const weekdays = parseWeekdays(formData);
  if (weekdays.length === 0) {
    return { mode: "error", error: "Pick at least one day" };
  }
  return { mode: "weekdays", weekdays };
}

interface CadenceFields {
  cadence: "DAILY" | "CUSTOM" | "EVERY_N_DAYS";
  weekdays: number[];
  intervalDays: number | null;
}

function deriveCadence(
  parsed: ReturnType<typeof parseCadence>,
): CadenceFields | null {
  if (parsed.mode === "error") return null;
  if (parsed.mode === "interval") {
    return {
      cadence: parsed.intervalDays === 1 ? "DAILY" : "EVERY_N_DAYS",
      weekdays: [],
      intervalDays: parsed.intervalDays === 1 ? null : parsed.intervalDays,
    };
  }
  const isDaily =
    parsed.weekdays.length === 0 || parsed.weekdays.length === 7;
  return {
    cadence: isDaily ? "DAILY" : "CUSTOM",
    weekdays: isDaily ? [] : parsed.weekdays,
    intervalDays: null,
  };
}

const HabitTitleSchema = z.object({
  title: z.string().trim().min(1, "Add a name"),
  categoryId: z.preprocess(
    (v) => (v === "" || v == null ? null : v),
    z.string().nullable(),
  ),
});

const UpdateHabitTitleSchema = HabitTitleSchema.extend({
  id: z.string().min(1),
});

const CategoryNameSchema = z.object({
  name: z.string().trim().min(1, "Add a name").max(40, "Keep it short"),
});

const UpdateCategoryFormSchema = CategoryNameSchema.extend({
  id: z.string().min(1),
});

export async function createHabit(
  _prev: HabitState,
  formData: FormData,
): Promise<HabitState> {
  const parsed = HabitTitleSchema.safeParse({
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const cadenceParsed = parseCadence(formData);
  if (cadenceParsed.mode === "error") return { error: cadenceParsed.error };
  const cadenceFields = deriveCadence(cadenceParsed);
  if (!cadenceFields) return { error: "Invalid cadence" };

  const db = getLocalDb();
  if (parsed.data.categoryId) {
    const cat = await db.habitCategories.get(parsed.data.categoryId);
    if (!cat) return { error: "Category not found" };
  }

  const t = now();
  await db.habits.add({
    id: genId(),
    title: parsed.data.title,
    cadence: cadenceFields.cadence,
    weekdays: cadenceFields.weekdays,
    intervalDays: cadenceFields.intervalDays,
    archived: false,
    categoryId: parsed.data.categoryId,
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function updateHabit(
  _prev: HabitState,
  formData: FormData,
): Promise<HabitState> {
  const parsed = UpdateHabitTitleSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const cadenceParsed = parseCadence(formData);
  if (cadenceParsed.mode === "error") return { error: cadenceParsed.error };
  const cadenceFields = deriveCadence(cadenceParsed);
  if (!cadenceFields) return { error: "Invalid cadence" };

  const db = getLocalDb();
  const habit = await db.habits.get(parsed.data.id);
  if (!habit) return { error: "Habit not found" };

  if (parsed.data.categoryId) {
    const cat = await db.habitCategories.get(parsed.data.categoryId);
    if (!cat) return { error: "Category not found" };
  }

  await db.habits.update(parsed.data.id, {
    title: parsed.data.title,
    cadence: cadenceFields.cadence,
    weekdays: cadenceFields.weekdays,
    intervalDays: cadenceFields.intervalDays,
    categoryId: parsed.data.categoryId,
    updatedAt: now(),
  });
  return { ok: true };
}

export async function deleteHabit(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getLocalDb();
  // Delete any habit check-in entries for this habit
  const entries = await db.entries.where("kind").equals("HABIT").toArray();
  const orphans = entries
    .filter((e) => (e.data as { habitId?: string })?.habitId === id)
    .map((e) => e.id);
  if (orphans.length > 0) {
    await db.entries.bulkDelete(orphans);
  }
  await db.habits.delete(id);
}

export async function toggleHabitToday(formData: FormData) {
  const habitId = String(formData.get("habitId") ?? "");
  if (!habitId) return;
  const db = getLocalDb();
  const habit = await db.habits.get(habitId);
  if (!habit) return;

  const t = now();
  const todays = (
    await db.entries.where("kind").equals("HABIT").toArray()
  ).filter(
    (e) => e.createdAt >= startOfDay(t) && e.createdAt <= endOfDay(t),
  );

  const existing = todays.find(
    (e) => (e.data as { habitId?: string })?.habitId === habitId,
  );

  if (existing) {
    await db.entries.delete(existing.id);
  } else {
    await db.entries.add({
      id: genId(),
      kind: "HABIT",
      data: { habitId, completedAt: t.toISOString() },
      tags: [],
      goalRefs: [],
      createdAt: t,
      updatedAt: t,
    });
  }
}

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const parsed = CategoryNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }
  const db = getLocalDb();
  const existing = await db.habitCategories
    .where("name")
    .equalsIgnoreCase(parsed.data.name)
    .first();
  if (existing) return { error: "Category already exists" };
  const t = now();
  await db.habitCategories.add({
    id: genId(),
    name: parsed.data.name,
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function updateCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const parsed = UpdateCategoryFormSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }
  const db = getLocalDb();
  const cat = await db.habitCategories.get(parsed.data.id);
  if (!cat) return { error: "Category not found" };
  const duplicate = await db.habitCategories
    .where("name")
    .equalsIgnoreCase(parsed.data.name)
    .filter((c) => c.id !== parsed.data.id)
    .first();
  if (duplicate)
    return { error: "A category with that name already exists" };
  await db.habitCategories.update(parsed.data.id, {
    name: parsed.data.name,
    updatedAt: now(),
  });
  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getLocalDb().habitCategories.delete(id);
}
