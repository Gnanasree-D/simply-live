import type { BlockEntry } from "@/core/entry/schema";

interface BlockDataPayload {
  title: string;
  start: string;
  end: string;
  todoRef?: string;
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

export function materializeBlock(row: EntryRow): BlockEntry {
  const data = (row.data ?? {}) as BlockDataPayload;
  return {
    kind: "block",
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    title: data.title,
    start: new Date(data.start),
    end: new Date(data.end),
    todoRef: data.todoRef,
  };
}
