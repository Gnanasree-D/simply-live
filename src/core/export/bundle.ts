import type {
  JournalEntry,
  TodoEntry,
  BlockEntry,
  GoalNoteEntry,
  ActivityEntry,
  FoodEntry,
  Mood,
} from "@/core/entry/schema";

export interface ExportGoal {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "ACHIEVED" | "ABANDONED";
  targetDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExportHabit {
  id: string;
  title: string;
  cadence: "DAILY" | "WEEKLY" | "CUSTOM" | "EVERY_N_DAYS";
  weekdays: number[];
  intervalDays: number | null;
  categoryName: string | null;
  archived: boolean;
  createdAt: Date;
  completions: Date[];
}

export interface ExportBundle {
  exportedAt: Date;
  userEmail: string;
  journals: JournalEntry[];
  todos: TodoEntry[];
  blocks: BlockEntry[];
  goalNotes: GoalNoteEntry[];
  goals: ExportGoal[];
  habits: ExportHabit[];
  activities: ActivityEntry[];
  foods: FoodEntry[];
}

export type { Mood };
