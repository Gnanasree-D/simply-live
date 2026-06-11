"use client";

import { Dumbbell, Droplet, Footprints, Trash2 } from "lucide-react";
import type { ActivityEntry } from "@/core/entry/schema";
import { SubmitIconButton } from "@/components/SubmitIconButton";
import { deleteActivity } from "../actions";

function timeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ActivityLog({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <ul className="rounded-lg border border-border bg-card divide-y divide-border">
      {entries.map((e) => (
        <li
          key={e.id}
          className="flex items-center gap-3 px-4 py-3 text-sm"
        >
          <span className="shrink-0 text-muted-foreground">
            {e.subtype === "workout" && (
              <Dumbbell className="size-4 text-primary" aria-hidden="true" />
            )}
            {e.subtype === "water" && (
              <Droplet
                className="size-4 text-primary"
                fill="currentColor"
                aria-hidden="true"
              />
            )}
            {e.subtype === "steps" && (
              <Footprints
                className="size-4 text-accent-foreground"
                aria-hidden="true"
              />
            )}
          </span>
          <div className="flex-1 min-w-0">
            {e.subtype === "workout" && (
              <p className="text-foreground truncate">
                {e.title}
                {e.durationMins !== undefined && (
                  <span className="text-muted-foreground">
                    {" · "}
                    {e.durationMins} min
                  </span>
                )}
              </p>
            )}
            {e.subtype === "water" && (
              <p className="text-foreground">Water · {e.ml ?? 0} ml</p>
            )}
            {e.subtype === "steps" && (
              <p className="text-foreground tabular-nums">
                Steps · {(e.count ?? 0).toLocaleString()}
              </p>
            )}
            {e.notes && (
              <p className="text-xs text-muted-foreground mt-0.5">{e.notes}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums shrink-0">
            {timeLabel(e.createdAt)}
          </span>
          <form action={deleteActivity}>
            <input type="hidden" name="id" value={e.id} />
            <SubmitIconButton
              icon={Trash2}
              ariaLabel="Delete entry"
              iconClassName="size-3.5"
              className="p-1 text-muted-foreground hover:text-destructive"
            />
          </form>
        </li>
      ))}
    </ul>
  );
}
