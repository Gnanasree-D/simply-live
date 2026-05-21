import type { TodoEntry } from "@/core/entry/schema";

interface TodoDataPayload {
  title: string;
  done?: boolean;
  due?: string | null;
  notes?: string;
}

interface EntryRow {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  goalRefs: string[];
  data: unknown;
}

export function materializeTodo(row: EntryRow): TodoEntry {
  const data = (row.data ?? {}) as TodoDataPayload;
  return {
    kind: "todo",
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    title: data.title,
    done: data.done ?? false,
    due: data.due ? new Date(data.due) : undefined,
    notes: data.notes,
  };
}
