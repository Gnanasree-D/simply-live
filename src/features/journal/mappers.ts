import type { JournalEntry, Mood } from "@/core/entry/schema";
import type { EntryRow } from "@/lib/local-db";

interface JournalDataPayload {
  body: string;
  mood?: Mood;
}

export function materializeJournal(row: EntryRow): JournalEntry {
  const data = (row.data ?? {}) as JournalDataPayload;
  return {
    kind: "journal",
    id: row.id,
    userId: "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    body: data.body,
    mood: data.mood,
  };
}
