import { z } from "zod";
import { genId, getLocalDb, now } from "@/lib/local-db";
import { getWeekDays, startOfWeek } from "@/core/time/day";

export interface ReviewState {
  ok?: boolean;
  error?: string;
  /** When set, the caller should navigate to this path. */
  redirectTo?: string;
}

const ReviewFormSchema = z.object({
  wins: z.string().trim(),
  challenges: z.string().trim(),
  lessons: z.string().trim(),
  focus: z.string().trim(),
});

export async function createWeeklyReview(
  _prev: ReviewState,
  formData: FormData,
): Promise<ReviewState> {
  const parsed = ReviewFormSchema.safeParse({
    wins: formData.get("wins") ?? "",
    challenges: formData.get("challenges") ?? "",
    lessons: formData.get("lessons") ?? "",
    focus: formData.get("focus") ?? "",
  });
  if (!parsed.success) {
    return { error: "Invalid input" };
  }

  const { wins, challenges, lessons, focus } = parsed.data;
  const hasContent =
    wins.length > 0 ||
    challenges.length > 0 ||
    lessons.length > 0 ||
    focus.length > 0;
  if (!hasContent) {
    return { error: "Fill in at least one section before saving" };
  }

  const t = now();
  const weekStart = startOfWeek(t);
  const weekEnd = getWeekDays(weekStart)[6];
  const dateRange = formatRange(weekStart, weekEnd);

  const sections: string[] = [];
  if (wins) sections.push(`— WHAT WENT WELL\n${wins}`);
  if (challenges) sections.push(`— WHAT DIDN'T GO AS PLANNED\n${challenges}`);
  if (lessons) sections.push(`— LESSONS\n${lessons}`);
  if (focus) sections.push(`— FOCUS NEXT WEEK\n${focus}`);

  const body = `WEEKLY REVIEW\n${dateRange}\n\n${sections.join("\n\n")}`;

  await getLocalDb().entries.add({
    id: genId(),
    kind: "JOURNAL",
    data: { body, template: "weekly-review" },
    tags: ["weekly-review"],
    goalRefs: [],
    createdAt: t,
    updatedAt: t,
  });
  return { ok: true, redirectTo: "/plan/journal" };
}

function formatRange(start: Date, end: Date): string {
  const sameMonth = start.getMonth() === end.getMonth();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric" })}, ${end.getFullYear()}`;
}
