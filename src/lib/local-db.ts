import Dexie, { type Table } from "dexie";
import { nanoid } from "nanoid";

export type EntryKind =
  | "JOURNAL"
  | "TODO"
  | "HABIT"
  | "BLOCK"
  | "GOAL_NOTE"
  | "ACTIVITY"
  | "FOOD";

export interface EntryRow {
  id: string;
  kind: EntryKind;
  data: unknown;
  tags: string[];
  goalRefs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GoalRow {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitRow {
  id: string;
  title: string;
  cadence: "DAILY" | "WEEKLY" | "CUSTOM" | "EVERY_N_DAYS";
  weekdays: number[];
  intervalDays: number | null;
  archived: boolean;
  categoryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface HabitCategoryRow {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

class SimplyLiveDB extends Dexie {
  entries!: Table<EntryRow, string>;
  goals!: Table<GoalRow, string>;
  habits!: Table<HabitRow, string>;
  habitCategories!: Table<HabitCategoryRow, string>;

  constructor() {
    super("simplylive");
    this.version(1).stores({
      entries: "id, kind, createdAt, [kind+createdAt], *goalRefs",
      goals: "id, status, createdAt",
      habits: "id, archived, categoryId",
      habitCategories: "id, name",
    });
  }
}

let dbInstance: SimplyLiveDB | null = null;

export function getLocalDb(): SimplyLiveDB {
  if (typeof window === "undefined") {
    throw new Error("Local DB is browser-only — only use inside client components.");
  }
  if (!dbInstance) dbInstance = new SimplyLiveDB();
  return dbInstance;
}

export function genId(): string {
  return nanoid(24);
}

/** Returns a fresh Date now; centralised so tests can stub if needed. */
export function now(): Date {
  return new Date();
}
