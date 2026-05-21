import type { FoodEntry, Meal } from "@/core/entry/schema";
import type { EntryRow } from "@/lib/local-db";

interface FoodDataPayload {
  name?: string;
  isJunk?: boolean;
  meal?: string;
  notes?: string;
}

function asMeal(s: unknown): Meal | undefined {
  if (s === "breakfast" || s === "lunch" || s === "dinner" || s === "snack")
    return s;
  return undefined;
}

export function materializeFood(row: EntryRow): FoodEntry {
  const data = (row.data ?? {}) as FoodDataPayload;
  return {
    kind: "food",
    id: row.id,
    userId: "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    name: data.name ?? "",
    isJunk: data.isJunk ?? false,
    meal: asMeal(data.meal),
    notes: data.notes,
  };
}
