"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { filterUserGoalIds } from "@/features/goals/actions";

export interface TodoState {
  ok?: boolean;
  error?: string;
}

const TitleDueSchema = z.object({
  title: z.string().trim().min(1, "Add a title"),
  due: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.date().optional(),
  ),
});

const UpdateTodoFormSchema = TitleDueSchema.extend({
  id: z.string().min(1),
});

function parseGoalRefs(formData: FormData): string[] {
  return formData
    .getAll("goalRefs")
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function createTodo(
  _prev: TodoState,
  formData: FormData,
): Promise<TodoState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = TitleDueSchema.safeParse({
    title: formData.get("title"),
    due: formData.get("due"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const goalRefs = await filterUserGoalIds(
    session.user.id,
    parseGoalRefs(formData),
  );

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "TODO",
      data: {
        title: parsed.data.title,
        done: false,
        due: parsed.data.due?.toISOString() ?? null,
      },
      tags: [],
      goalRefs,
    },
  });
  revalidatePath("/todos");
  revalidatePath("/today");
  revalidatePath("/goals");
  return { ok: true };
}

export async function updateTodo(
  _prev: TodoState,
  formData: FormData,
): Promise<TodoState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = UpdateTodoFormSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    due: formData.get("due"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const row = await db.entry.findFirst({
    where: { id: parsed.data.id, userId: session.user.id, kind: "TODO" },
  });
  if (!row) return { error: "To-do not found" };

  const goalRefs = await filterUserGoalIds(
    session.user.id,
    parseGoalRefs(formData),
  );

  const existing = (row.data ?? {}) as Record<string, unknown>;
  await db.entry.update({
    where: { id: parsed.data.id },
    data: {
      data: {
        ...existing,
        title: parsed.data.title,
        due: parsed.data.due?.toISOString() ?? null,
      },
      goalRefs,
    },
  });

  revalidatePath("/todos");
  revalidatePath("/today");
  revalidatePath("/goals");
  return { ok: true };
}

export async function toggleTodoDone(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const row = await db.entry.findFirst({
    where: { id, userId: session.user.id, kind: "TODO" },
  });
  if (!row) return;

  const data = (row.data ?? {}) as Record<string, unknown>;
  await db.entry.update({
    where: { id },
    data: { data: { ...data, done: !data.done } },
  });

  revalidatePath("/todos");
  revalidatePath("/today");
  revalidatePath("/goals");
}

export async function deleteTodo(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.entry.deleteMany({
    where: { id, userId: session.user.id, kind: "TODO" },
  });

  revalidatePath("/todos");
  revalidatePath("/today");
  revalidatePath("/goals");
}
