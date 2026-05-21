"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { MoodSchema } from "@/core/entry/schema";
import { filterUserGoalIds } from "@/features/goals/actions";

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
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = BodyMoodSchema.safeParse({
    body: formData.get("body"),
    mood: formData.get("mood"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.body?.[0] ?? "Invalid input",
    };
  }

  const goalRefs = await filterUserGoalIds(
    session.user.id,
    parseGoalRefs(formData),
  );

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "JOURNAL",
      data: { body: parsed.data.body, mood: parsed.data.mood ?? null },
      tags: [],
      goalRefs,
    },
  });

  revalidatePath("/journal");
  revalidatePath("/today");
  revalidatePath("/goals");
  return { ok: true };
}

export async function updateJournalEntry(
  _prev: JournalState,
  formData: FormData,
): Promise<JournalState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = UpdateJournalFormSchema.safeParse({
    id: formData.get("id"),
    body: formData.get("body"),
    mood: formData.get("mood"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.body?.[0] ?? "Invalid input",
    };
  }

  const row = await db.entry.findFirst({
    where: { id: parsed.data.id, userId: session.user.id, kind: "JOURNAL" },
  });
  if (!row) return { error: "Entry not found" };

  const goalRefs = await filterUserGoalIds(
    session.user.id,
    parseGoalRefs(formData),
  );

  const existing = (row.data ?? {}) as Record<string, unknown>;
  await db.entry.update({
    where: { id: parsed.data.id },
    data: {
      data: {
        ...existing,
        body: parsed.data.body,
        mood: parsed.data.mood ?? null,
      },
      goalRefs,
    },
  });

  revalidatePath("/journal");
  revalidatePath("/today");
  revalidatePath("/goals");
  return { ok: true };
}

export async function deleteJournalEntry(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.entry.deleteMany({
    where: { id, userId: session.user.id, kind: "JOURNAL" },
  });

  revalidatePath("/journal");
  revalidatePath("/today");
  revalidatePath("/goals");
}
