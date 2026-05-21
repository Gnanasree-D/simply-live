import { getLocalDb } from "@/lib/local-db";
import type { JournalEntry } from "@/core/entry/schema";
import { materializeJournal } from "./mappers";

export interface ListJournalOpts {
  limit?: number;
  since?: Date;
  until?: Date;
}

export async function listJournalEntries(
  opts: ListJournalOpts = {},
): Promise<JournalEntry[]> {
  let coll = getLocalDb()
    .entries.where("kind")
    .equals("JOURNAL");
  let rows = await coll.toArray();
  if (opts.since) rows = rows.filter((r) => r.createdAt >= opts.since!);
  if (opts.until) rows = rows.filter((r) => r.createdAt < opts.until!);
  rows.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  if (opts.limit) rows = rows.slice(0, opts.limit);
  return rows.map(materializeJournal);
}

export async function getJournalEntry(
  id: string,
): Promise<JournalEntry | null> {
  const row = await getLocalDb().entries.get(id);
  if (!row || row.kind !== "JOURNAL") return null;
  return materializeJournal(row);
}
