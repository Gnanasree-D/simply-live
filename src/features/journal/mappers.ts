import type { JournalEntry, Mood } from "@/core/entry/schema";

interface JournalDataPayload {
  body: string;
  mood?: Mood;
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

export function materializeJournal(row: EntryRow): JournalEntry {
  const data = (row.data ?? {}) as JournalDataPayload;
  return {
    kind: "journal",
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    body: data.body,
    mood: data.mood,
  };
}
