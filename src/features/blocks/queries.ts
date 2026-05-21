import { getLocalDb } from "@/lib/local-db";
import type { BlockEntry } from "@/core/entry/schema";
import { materializeBlock } from "./mappers";
import { endOfDay, startOfDay } from "@/core/time/day";

export async function listBlocksForRange(
  rangeStart: Date,
  rangeEnd: Date,
): Promise<BlockEntry[]> {
  const rows = await getLocalDb()
    .entries.where("kind")
    .equals("BLOCK")
    .toArray();
  return rows
    .map(materializeBlock)
    .filter((b) => b.start >= rangeStart && b.start <= rangeEnd)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function listBlocksForDay(day: Date): Promise<BlockEntry[]> {
  return listBlocksForRange(startOfDay(day), endOfDay(day));
}
