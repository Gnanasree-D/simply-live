import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";
import { filterGoalIds } from "@/features/goals/actions";

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
  const parsed = TitleDueSchema.safeParse({
    title: formData.get("title"),
    due: formData.get("due"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.title?.[0] ?? "Invalid input",
    };
  }

  const goalRefs = await filterGoalIds(parseGoalRefs(formData));
  const t = now();
  await getLocalDb().entries.add({
    id: genId(),
    kind: "TODO",
    data: {
      title: parsed.data.title,
      done: false,
      due: parsed.data.due?.toISOString() ?? null,
    },
    tags: [],
    goalRefs,
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function updateTodo(
  _prev: TodoState,
  formData: FormData,
): Promise<TodoState> {
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

  const db = getLocalDb();
  const row = await db.entries.get(parsed.data.id);
  if (!row || row.kind !== "TODO") return { error: "To-do not found" };

  const goalRefs = await filterGoalIds(parseGoalRefs(formData));
  const existing = (row.data ?? {}) as Record<string, unknown>;
  await db.entries.update(parsed.data.id, {
    data: {
      ...existing,
      title: parsed.data.title,
      due: parsed.data.due?.toISOString() ?? null,
    },
    goalRefs,
    updatedAt: now(),
  });
  return { ok: true };
}

export async function toggleTodoDone(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = getLocalDb();
  const row = await db.entries.get(id);
  if (!row || row.kind !== "TODO") return;
  const data = (row.data ?? {}) as Record<string, unknown>;
  await db.entries.update(id, {
    data: { ...data, done: !data.done },
    updatedAt: now(),
  });
}

export async function deleteTodo(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getLocalDb().entries.delete(id);
}
