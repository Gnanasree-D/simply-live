import type { BlockEntry } from "@/core/entry/schema";
import type { EntryRow } from "@/lib/local-db";

interface BlockDataPayload {
  title: string;
  start: string;
  end: string;
  todoRef?: string;
}

export function materializeBlock(row: EntryRow): BlockEntry {
  const data = (row.data ?? {}) as BlockDataPayload;
  return {
    kind: "block",
    id: row.id,
    userId: "",
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
