import type { ActivityEntry, ActivitySubtype } from "@/core/entry/schema";
import { readWaterMl } from "@/core/activity/water";
import type { EntryRow } from "@/lib/local-db";

interface ActivityDataPayload {
  subtype?: string;
  title?: string;
  durationMins?: number;
  ml?: number;
  cups?: number;
  count?: number;
  notes?: string;
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
    userId: "",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    tags: row.tags,
    goalRefs: row.goalRefs,
    subtype: data.subtype,
    title: data.title,
    durationMins: data.durationMins,
    ml: data.subtype === "water" ? readWaterMl(data) : undefined,
    count: data.count,
    notes: data.notes,
  };
}
