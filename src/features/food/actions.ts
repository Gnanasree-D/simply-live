import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";

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
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }

  const t = now();
  await getLocalDb().entries.add({
    id: genId(),
    kind: "FOOD",
    data: {
      name: parsed.data.name,
      isJunk: parsed.data.isJunk,
      meal: parsed.data.meal,
      notes: parsed.data.notes,
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
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.name?.[0] ?? "Invalid input",
    };
  }
  const db = getLocalDb();
  const row = await db.entries.get(parsed.data.id);
  if (!row || row.kind !== "FOOD") return { error: "Food not found" };

  await db.entries.update(parsed.data.id, {
    data: {
      name: parsed.data.name,
      isJunk: parsed.data.isJunk,
      meal: parsed.data.meal,
      notes: parsed.data.notes,
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
