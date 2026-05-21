import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { loadExportBundle } from "@/features/export/queries";
import { ConsistencyReport } from "@/features/export/pdf";
import {
  buildBodyReport,
  buildGoalReport,
  buildHabitReport,
  type EntryWithGoalRefs,
} from "@/core/export/pdf-data";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function stamp(d: Date): string {
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const bundle = await loadExportBundle(
    session.user.id,
    session.user.email ?? "",
  );

  const now = new Date();
  const habits = bundle.habits
    .filter((h) => !h.archived)
    .map((h) => buildHabitReport(h, now));

  const allEntries: EntryWithGoalRefs[] = [
    ...bundle.journals,
    ...bundle.todos,
    ...bundle.blocks,
    ...bundle.goalNotes,
  ];
  const milestonesByGoal = new Map<string, typeof bundle.todos>();
  for (const t of bundle.todos) {
    for (const ref of t.goalRefs) {
      const list = milestonesByGoal.get(ref) ?? [];
      list.push(t);
      milestonesByGoal.set(ref, list);
    }
  }
  const goals = bundle.goals.map((g) =>
    buildGoalReport(g, allEntries, milestonesByGoal.get(g.id) ?? [], now),
  );

  const body = buildBodyReport(bundle.activities, bundle.foods, now, 14);

  const buffer = await renderToBuffer(
    ConsistencyReport({
      userEmail: bundle.userEmail,
      exportedAt: bundle.exportedAt,
      habits,
      goals,
      body,
    }),
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="simplylive-${stamp(bundle.exportedAt)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
