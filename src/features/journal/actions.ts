import { z } from "zod";
import { MoodSchema } from "@/core/entry/schema";
import { genId, getLocalDb, now } from "@/lib/local-db";
import { filterGoalIds } from "@/features/goals/actions";

export interface JournalState {
  ok?: boolean;
  error?: string;
}

const BodyMoodSchema = z.object({
  body: z.string().trim().min(1, "Write something first"),
  mood: z.preprocess((v) => (v === "" ? undefined : v), MoodSchema.optional()),
});

const UpdateJournalFormSchema = BodyMoodSchema.extend({
  id: z.string().min(1),
});

function parseGoalRefs(formData: FormData): string[] {
  return formData
    .getAll("goalRefs")
    .map(String)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export async function createJournalEntry(
  _prev: JournalState,
  formData: FormData,
): Promise<JournalState> {
  const parsed = BodyMoodSchema.safeParse({
    body: formData.get("body"),
    mood: formData.get("mood"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.body?.[0] ?? "Invalid input",
    };
  }

  const goalRefs = await filterGoalIds(parseGoalRefs(formData));
  const t = now();
  await getLocalDb().entries.add({
    id: genId(),
    kind: "JOURNAL",
    data: { body: parsed.data.body, mood: parsed.data.mood ?? null },
    tags: [],
    goalRefs,
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true };
}

export async function updateJournalEntry(
  _prev: JournalState,
  formData: FormData,
): Promise<JournalState> {
  const parsed = UpdateJournalFormSchema.safeParse({
    id: formData.get("id"),
    body: formData.get("body"),
    mood: formData.get("mood"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.flatten().fieldErrors.body?.[0] ?? "Invalid input",
    };
  }

  const db = getLocalDb();
  const row = await db.entries.get(parsed.data.id);
  if (!row || row.kind !== "JOURNAL") return { error: "Entry not found" };

  const goalRefs = await filterGoalIds(parseGoalRefs(formData));
  const existing = (row.data ?? {}) as Record<string, unknown>;
  await db.entries.update(parsed.data.id, {
    data: {
      ...existing,
      body: parsed.data.body,
      mood: parsed.data.mood ?? null,
    },
    goalRefs,
    updatedAt: now(),
  });
  return { ok: true };
}

export async function deleteJournalEntry(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await getLocalDb().entries.delete(id);
}
