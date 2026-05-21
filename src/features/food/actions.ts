"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface FoodState {
  ok?: boolean;
  error?: string;
}

const MealEnum = z.enum(["breakfast", "lunch", "dinner", "snack"]);

const CreateFoodSchema = z.object({
  name: z.string().trim().min(1, "Add a name"),
  isJunk: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  meal: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    MealEnum.optional(),
  ),
  notes: z.string().optional(),
});

const UpdateFoodSchema = CreateFoodSchema.extend({
  id: z.string().min(1),
});

function revalidateFood() {
  revalidatePath("/food");
  revalidatePath("/today");
}

export async function createFood(
  _prev: FoodState,
  formData: FormData,
): Promise<FoodState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

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

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "FOOD",
      data: {
        name: parsed.data.name,
        isJunk: parsed.data.isJunk,
        meal: parsed.data.meal,
        notes: parsed.data.notes,
      },
      tags: [],
      goalRefs: [],
    },
  });
  revalidateFood();
  return { ok: true };
}

export async function updateFood(
  _prev: FoodState,
  formData: FormData,
): Promise<FoodState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

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

  await db.entry.updateMany({
    where: { id: parsed.data.id, userId: session.user.id, kind: "FOOD" },
    data: {
      data: {
        name: parsed.data.name,
        isJunk: parsed.data.isJunk,
        meal: parsed.data.meal,
        notes: parsed.data.notes,
      },
    },
  });
  revalidateFood();
  return { ok: true };
}

export async function deleteFood(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.entry.deleteMany({
    where: { id, userId: session.user.id, kind: "FOOD" },
  });
  revalidateFood();
}
