import { Droplet, Dumbbell, Footprints, Utensils } from "lucide-react";
import type { BodySummary } from "../queries";
import { cn } from "@/lib/utils";

function waterIntensity(ml: number): string {
  if (ml === 0) return "bg-muted";
  if (ml <= 500) return "bg-primary/30";
  if (ml <= 1250) return "bg-primary/55";
  if (ml <= 2000) return "bg-primary/80";
  return "bg-primary";
}

function stepsIntensity(steps: number): string {
  if (steps === 0) return "bg-muted";
  if (steps < 3000) return "bg-[var(--accent-ochre)]/30";
  if (steps < 6000) return "bg-[var(--accent-ochre)]/55";
  if (steps < 9000) return "bg-[var(--accent-ochre)]/80";
  return "bg-[var(--accent-ochre)]";
}

export function BodyTrendRows({ body }: { body: BodySummary }) {
  return (
    <div className="rounded-lg border border-border bg-card divide-y divide-border">
      <Row
        icon={<Dumbbell className="size-4 text-primary" aria-hidden="true" />}
        label="Workouts"
        sub={
          body.workoutDays > 0
            ? `${body.workoutDays} ${body.workoutDays === 1 ? "day" : "days"} · ${body.totalWorkoutMinutes}m`
            : "—"
        }
      >
        <div className="flex gap-0.5 shrink-0">
          {body.days.map((d, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 h-4 rounded-[1px]",
                d.workout ? "bg-primary" : "bg-muted",
              )}
              title={`${d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${d.workoutMinutes > 0 ? `${d.workoutMinutes}m workout` : "no workout"}`}
            />
          ))}
        </div>
      </Row>

      <Row
        icon={
          <Droplet
            className="size-4 text-primary"
            fill="currentColor"
            aria-hidden="true"
          />
        }
        label="Water"
        sub={body.avgWaterMl > 0 ? `${body.avgWaterMl} ml/day avg` : "—"}
      >
        <div className="flex gap-0.5 shrink-0">
          {body.days.map((d, i) => (
            <div
              key={i}
              className={cn("w-1.5 h-4 rounded-[1px]", waterIntensity(d.waterMl))}
              title={`${d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${d.waterMl} ml`}
            />
          ))}
        </div>
      </Row>

      <Row
        icon={
          <Footprints
            className="size-4 text-accent-foreground"
            aria-hidden="true"
          />
        }
        label="Steps"
        sub={
          body.avgSteps > 0
            ? `${body.avgSteps.toLocaleString()}/day avg`
            : "—"
        }
      >
        <div className="flex gap-0.5 shrink-0">
          {body.days.map((d, i) => (
            <div
              key={i}
              className={cn("w-1.5 h-4 rounded-[1px]", stepsIntensity(d.steps))}
              title={`${d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${d.steps.toLocaleString()} steps`}
            />
          ))}
        </div>
      </Row>

      <Row
        icon={
          <Utensils
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        }
        label="Food"
        sub={
          body.totalFood > 0
            ? `${body.totalFood} entries${body.totalJunk > 0 ? ` · ${body.totalJunk} junk` : ""}`
            : "—"
        }
      >
        <div className="flex gap-0.5 shrink-0 items-end">
          {body.days.map((d, i) => {
            const total = d.foodEntries;
            const junk = d.junkEntries;
            const cleanH = total > 0 ? Math.max(3, Math.min(16, (total - junk) * 4)) : 0;
            const junkH = junk > 0 ? Math.max(3, Math.min(16, junk * 4)) : 0;
            return (
              <div
                key={i}
                className="w-1.5 h-4 flex flex-col-reverse"
                title={`${d.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${total} entries${junk > 0 ? `, ${junk} junk` : ""}`}
              >
                {total === 0 ? (
                  <div className="w-full h-full bg-muted rounded-[1px]" />
                ) : (
                  <>
                    {junkH > 0 && (
                      <div
                        className="w-full bg-destructive rounded-b-[1px]"
                        style={{ height: junkH }}
                      />
                    )}
                    {cleanH > 0 && (
                      <div
                        className="w-full bg-[var(--accent-mint)] rounded-t-[1px]"
                        style={{ height: cleanH }}
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Row>
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      {children}
    </div>
  );
}
