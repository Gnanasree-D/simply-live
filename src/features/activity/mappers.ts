import type { ActivityEntry, ActivitySubtype } from "@/core/entry/schema";

interface ActivityDataPayload {
  subtype?: string;
  title?: string;
  durationMins?: number;
  cups?: number;
  count?: number;
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

function isValidSubtype(s: unknown): s is ActivitySubtype {
  return s === "workout" || s === "water" || s === "steps";
}

export function materializeActivity(row: EntryRow): ActivityEntry | null {
  const data = (row.data ?? {}) as ActivityDataPayload;
  if (!isValidSubtype(data.subtype)) return null;
  return {
    kind: "activity",
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    subtype: data.subtype,
    title: data.title,
    durationMins: data.durationMins,
    cups: data.cups,
    count: data.count,
    notes: data.notes,
  };
}
