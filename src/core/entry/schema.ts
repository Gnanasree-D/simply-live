import { z } from "zod";

export const MoodSchema = z.enum([
  "great",
  "good",
  "okay",
  "low",
  "rough",
]);
export type Mood = z.infer<typeof MoodSchema>;

const EntryBase = z.object({
  id: z.string().cuid(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  tags: z.array(z.string()).default([]),
  goalRefs: z.array(z.string()).default([]),
});

export const JournalEntrySchema = EntryBase.extend({
  kind: z.literal("journal"),
  body: z.string().min(1),
  mood: MoodSchema.optional(),
});

export const TodoEntrySchema = EntryBase.extend({
  kind: z.literal("todo"),
  title: z.string().min(1),
  done: z.boolean().default(false),
  due: z.date().optional(),
  notes: z.string().optional(),
});

export const HabitEntrySchema = EntryBase.extend({
  kind: z.literal("habit"),
  habitId: z.string(),
  completedAt: z.date(),
  note: z.string().optional(),
});

export const BlockEntrySchema = EntryBase.extend({
  kind: z.literal("block"),
  start: z.date(),
  end: z.date(),
  title: z.string().min(1),
  todoRef: z.string().optional(),
});

export const GoalNoteEntrySchema = EntryBase.extend({
  kind: z.literal("goal-note"),
  goalId: z.string(),
  body: z.string().min(1),
});

export const ActivitySubtypeSchema = z.enum(["workout", "water", "steps"]);
export type ActivitySubtype = z.infer<typeof ActivitySubtypeSchema>;

export const ActivityEntrySchema = EntryBase.extend({
  kind: z.literal("activity"),
  subtype: ActivitySubtypeSchema,
  title: z.string().optional(),
  durationMins: z.number().int().nonnegative().optional(),
  cups: z.number().int().nonnegative().optional(),
  count: z.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const MealSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);
export type Meal = z.infer<typeof MealSchema>;

export const FoodEntrySchema = EntryBase.extend({
  kind: z.literal("food"),
  name: z.string().min(1),
  isJunk: z.boolean().default(false),
  meal: MealSchema.optional(),
  notes: z.string().optional(),
});

export const EntrySchema = z.discriminatedUnion("kind", [
  JournalEntrySchema,
  TodoEntrySchema,
  HabitEntrySchema,
  BlockEntrySchema,
  GoalNoteEntrySchema,
  ActivityEntrySchema,
  FoodEntrySchema,
]);

export type Entry = z.infer<typeof EntrySchema>;
export type EntryKind = Entry["kind"];
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type TodoEntry = z.infer<typeof TodoEntrySchema>;
export type HabitEntry = z.infer<typeof HabitEntrySchema>;
export type BlockEntry = z.infer<typeof BlockEntrySchema>;
export type GoalNoteEntry = z.infer<typeof GoalNoteEntrySchema>;
export type ActivityEntry = z.infer<typeof ActivityEntrySchema>;
export type FoodEntry = z.infer<typeof FoodEntrySchema>;

export const NewJournalInput = JournalEntrySchema.pick({
  body: true,
  mood: true,
  tags: true,
  goalRefs: true,
}).partial({ mood: true, tags: true, goalRefs: true });

export const NewTodoInput = TodoEntrySchema.pick({
  title: true,
  due: true,
  notes: true,
  tags: true,
  goalRefs: true,
}).partial({ due: true, notes: true, tags: true, goalRefs: true });
