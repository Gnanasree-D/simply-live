"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export interface BlockState {
  ok?: boolean;
  error?: string;
}

const BlockFormSchema = z.object({
  title: z.string().trim().min(1, "Add a title"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
});

const UpdateBlockSchema = BlockFormSchema.extend({
  id: z.string().min(1),
});

function buildDate(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

export async function createBlock(
  _prev: BlockState,
  formData: FormData,
): Promise<BlockState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = BlockFormSchema.safeParse({
    title: formData.get("title"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.title?.[0] ??
        parsed.error.flatten().fieldErrors.date?.[0] ??
        parsed.error.flatten().fieldErrors.startTime?.[0] ??
        parsed.error.flatten().fieldErrors.endTime?.[0] ??
        "Invalid input",
    };
  }

  const start = buildDate(parsed.data.date, parsed.data.startTime);
  const end = buildDate(parsed.data.date, parsed.data.endTime);
  if (end <= start) return { error: "End must be after start" };

  await db.entry.create({
    data: {
      userId: session.user.id,
      kind: "BLOCK",
      data: {
        title: parsed.data.title,
        start: start.toISOString(),
        end: end.toISOString(),
      },
      tags: [],
      goalRefs: [],
    },
  });

  revalidatePath("/timetable");
  revalidatePath("/today");
  return { ok: true };
}

export async function updateBlock(
  _prev: BlockState,
  formData: FormData,
): Promise<BlockState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const parsed = UpdateBlockSchema.safeParse({
    id: formData.get("id"),
    title: formData.get("title"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const row = await db.entry.findFirst({
    where: { id: parsed.data.id, userId: session.user.id, kind: "BLOCK" },
  });
  if (!row) return { error: "Block not found" };

  const start = buildDate(parsed.data.date, parsed.data.startTime);
  const end = buildDate(parsed.data.date, parsed.data.endTime);
  if (end <= start) return { error: "End must be after start" };

  const existing = (row.data ?? {}) as Record<string, unknown>;
  await db.entry.update({
    where: { id: parsed.data.id },
    data: {
      data: {
        ...existing,
        title: parsed.data.title,
        start: start.toISOString(),
        end: end.toISOString(),
      },
    },
  });

  revalidatePath("/timetable");
  revalidatePath("/today");
  return { ok: true };
}

export async function deleteBlock(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db.entry.deleteMany({
    where: { id, userId: session.user.id, kind: "BLOCK" },
  });

  revalidatePath("/timetable");
  revalidatePath("/today");
}
