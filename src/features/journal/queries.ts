import "server-only";
import { db } from "@/lib/db";
import type { JournalEntry } from "@/core/entry/schema";
import { materializeJournal } from "./mappers";

export interface ListJournalOpts {
  limit?: number;
  since?: Date;
  until?: Date;
}

export async function listJournalEntries(
  userId: string,
  opts: ListJournalOpts = {},
): Promise<JournalEntry[]> {
  const dateFilter =
    opts.since || opts.until
      ? {
          createdAt: {
            ...(opts.since ? { gte: opts.since } : {}),
            ...(opts.until ? { lt: opts.until } : {}),
          },
        }
      : {};

  const rows = await db.entry.findMany({
    where: { userId, kind: "JOURNAL", ...dateFilter },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
  });
  return rows.map(materializeJournal);
}

export async function getJournalEntry(
  userId: string,
  id: string,
): Promise<JournalEntry | null> {
  const row = await db.entry.findFirst({
    where: { id, userId, kind: "JOURNAL" },
  });
  return row ? materializeJournal(row) : null;
}
