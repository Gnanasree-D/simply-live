"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
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
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

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

  if (parsed.data.categoryId) {
    const cat = await db.habitCategory.findFirst({
      where: { id: parsed.data.categoryId, userId: session.user.id },
    });
    if (!cat) return { error: "Category not found" };
  }

  await db.habit.create({
    data: {
      userId: session.user.id,
      title: parsed.data.title,
      cadence: cadenceFields.cadence,
      weekdays: cadenceFields.weekdays,
      intervalDays: cadenceFields.intervalDays,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidatePath("/habits");
  revalidatePath("/today");
  return { ok: true };
}

export async function updateHabit(
  _prev: HabitState,
  formData: FormData,
): Promise<HabitState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

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

  const habit = await db.habit.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!habit) return { error: "Habit not found" };

  if (parsed.data.categoryId) {
    const cat = await db.habitCategory.findFirst({
      where: { id: parsed.data.categoryId, userId: session.user.id },
    });
    if (!cat) return { error: "Category not found" };
  }

  await db.habit.update({
    where: { id: parsed.data.id },
    data: {
      title: parsed.data.title,
      cadence: cadenceFields.cadence,
      weekdays: cadenceFields.weekdays,
      intervalDays: cadenceFields.intervalDays,
      categoryId: parsed.data.categoryId,
    },
  });

  revalidatePath("/habits");
  revalidatePath("/today");
  return { ok: true };
}

export async function deleteHabit(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const habit = await db.habit.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!habit) return;

  const entries = await db.entry.findMany({
    where: { userId: session.user.id, kind: "HABIT" },
    select: { id: true, data: true },
  });
  const orphans = entries
    .filter((e) => (e.data as { habitId?: string })?.habitId === id)
    .map((e) => e.id);
  if (orphans.length > 0) {
    await db.entry.deleteMany({ where: { id: { in: orphans } } });
  }

  await db.habit.delete({ where: { id } });

  revalidatePath("/habits");
  revalidatePath("/today");
}

export async function toggleHabitToday(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const habitId = String(formData.get("habitId") ?? "");
  if (!habitId) return;

  const habit = await db.habit.findFirst({
    where: { id: habitId, userId: session.user.id },
  });
  if (!habit) return;

  const now = new Date();
  const todays = await db.entry.findMany({
    where: {
      userId: session.user.id,
      kind: "HABIT",
      createdAt: { gte: startOfDay(now), lt: endOfDay(now) },
    },
    select: { id: true, data: true },
  });

  const existing = todays.find(
    (e) => (e.data as { habitId?: string })?.habitId === habitId,
  );

  if (existing) {
    await db.entry.delete({ where: { id: existing.id } });
  } else {
    await db.entry.create({
      data: {
        userId: session.user.id,
        kind: "HABIT",
        data: { habitId, completedAt: now.toISOString() },
        tags: [],
        goalRefs: [],
      },
    });
  }

  revalidatePath("/habits");
  revalidatePath("/today");
}

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = CategoryNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }

  try {
    await db.habitCategory.create({
      data: { userId: session.user.id, name: parsed.data.name },
    });
  } catch {
    return { error: "Category already exists" };
  }

  revalidatePath("/habits");
  return { ok: true };
}

export async function updateCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = UpdateCategoryFormSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }

  const cat = await db.habitCategory.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
  });
  if (!cat) return { error: "Category not found" };

  try {
    await db.habitCategory.update({
      where: { id: parsed.data.id },
      data: { name: parsed.data.name },
    });
  } catch {
    return { error: "A category with that name already exists" };
  }

  revalidatePath("/habits");
  revalidatePath("/today");
  return { ok: true };
}

export async function deleteCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.habitCategory.deleteMany({
    where: { id, userId: session.user.id },
  });

  revalidatePath("/habits");
  revalidatePath("/today");
}
