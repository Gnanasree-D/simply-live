import "server-only";
import { db } from "@/lib/db";
import type { BlockEntry } from "@/core/entry/schema";
import { materializeBlock } from "./mappers";
import { endOfDay, startOfDay } from "@/core/time/day";

export async function listBlocksForRange(
  userId: string,
  rangeStart: Date,
  rangeEnd: Date,
): Promise<BlockEntry[]> {
  // Personal-scale: fetch recent and filter in JS.
  const rows = await db.entry.findMany({
    where: { userId, kind: "BLOCK" },
    orderBy: { createdAt: "desc" },
    take: 2000,
  });

  return rows
    .map(materializeBlock)
    .filter((b) => b.start >= rangeStart && b.start <= rangeEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function listBlocksForDay(
  userId: string,
  day: Date,
): Promise<BlockEntry[]> {
  return listBlocksForRange(userId, startOfDay(day), endOfDay(day));
}
