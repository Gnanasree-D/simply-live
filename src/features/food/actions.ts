import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";
import { lookupCalories } from "./calories";

export interface FoodState {
  ok?: boolean;
  error?: string;
}

const MealEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const CreateFoodSchema = z.object({
  name: z.string().trim().min(1, "Add a name"),
  isJunk: z.preprocess(
    (v) => v === "on" || v === "true" || v === true,
    z.boolean(),
  ),
  meal: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    MealEnum.optional(),
  ),
  notes: z.string().optional(),
  grams: z.preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().int().positive().max(5000).optional(),
  ),
});

const UpdateFoodSchema = CreateFoodSchema.extend({
  id: z.string().min(1),
});

export async function createFood(
  _prev: FoodState,
  formData: FormData,
): Promise<FoodState> {
  const parsed = CreateFoodSchema.safeParse({
    name: formData.get("name"),
    isJunk: formData.get("isJunk"),
    meal: formData.get("meal"),
    notes: formData.get("notes") || undefined,
    grams: formData.get("grams"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }

  const est = await lookupCalories(parsed.data.name, parsed.data.grams);

  const t = now();
  await getLocalDb().entries.add({
    id: genId(),
    kind: "FOOD",
    data: {
      name: parsed.data.name,
      isJunk: parsed.data.isJunk,
      meal: parsed.data.meal,
      notes: parsed.data.notes,
      calories: est.calories ?? undefined,
      grams: parsed.data.grams,
      protein: est.protein,
      carbs: est.carbs,
      fat: est.fat,
      fiber: est.fiber,
    },
    tags: [],
    goalRefs: [],
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function updateFood(
  _prev: FoodState,
  formData: FormData,
): Promise<FoodState> {
  const parsed = UpdateFoodSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    isJunk: formData.get("isJunk"),
    meal: formData.get("meal"),
    notes: formData.get("notes") || undefined,
    grams: formData.get("grams"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }
  const db = getLocalDb();
  const row = await db.entries.get(parsed.data.id);
  if (!row || row.kind !== "FOOD") return { error: "Food not found" };

  const prev = (row.data ?? {}) as {
    name?: string;
    calories?: number;
    grams?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  const unchanged =
    prev.name === parsed.data.name && prev.grams === parsed.data.grams;
  const nutrition = unchanged
    ? {
        calories: prev.calories,
        protein: prev.protein,
        carbs: prev.carbs,
        fat: prev.fat,
        fiber: prev.fiber,
      }
    : await lookupCalories(parsed.data.name, parsed.data.grams).then((e) => ({
        calories: e.calories ?? undefined,
        protein: e.protein,
        carbs: e.carbs,
        fat: e.fat,
        fiber: e.fiber,
      }));

  await db.entries.update(parsed.data.id, {
    data: {
      name: parsed.data.name,
      isJunk: parsed.data.isJunk,
      meal: parsed.data.meal,
      notes: parsed.data.notes,
      grams: parsed.data.grams,
      ...nutrition,
    },
    updatedAt: now(),
  });
  return { ok: true };
}

export async function deleteFood(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getLocalDb().entries.delete(id);
}
