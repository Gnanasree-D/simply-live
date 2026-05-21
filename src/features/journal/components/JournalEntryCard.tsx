"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { JournalEntry } from "@/core/entry/schema";
import {
  deleteJournalEntry,
  updateJournalEntry,
  type JournalState,
} from "../actions";
import { MoodPicker } from "./MoodPicker";
import { SubmitIconButton } from "@/components/SubmitIconButton";
import { GoalPicker } from "@/features/goals/components/GoalPicker";
import type { GoalPickerOption } from "@/features/goals/queries";

const initial: JournalState = {};

export function JournalEntryCard({
  entry,
  goals = [],
}: {
  entry: JournalEntry;
  goals?: GoalPickerOption[];
}) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [state, action, pending] = useActionState(updateJournalEntry, initial);

  const isLong = entry.body.length > 400 || entry.body.split("\n").length > 6;

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  const time = entry.createdAt.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const edited = entry.updatedAt.getTime() - entry.createdAt.getTime() > 1000;

  if (editing) {
    return (
      <article className="rounded-lg border border-border bg-card p-5">
        <form action={action} className="space-y-4">
          <input type="hidden" name="id" value={entry.id} />
          <textarea
            name="body"
            rows={4}
            required
            defaultValue={entry.body}
            autoFocus
            className="w-full resize-none border-0 bg-transparent focus:outline-none text-base leading-relaxed prose-paper"
          />
          <MoodPicker name="mood" initialValue={entry.mood ?? ""} />
          {goals.length > 0 && (
            <GoalPicker goals={goals} initialSelected={entry.goalRefs} />
          )}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </article>
    );
  }

  return (
    <article className="rounded-lg border border-border bg-card p-5 space-y-3">
      <header className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <time dateTime={entry.createdAt.toISOString()}>
          {time}
          {edited && <span className="italic ml-1">· edited</span>}
        </time>
        <div className="flex items-center gap-2">
          {entry.mood && (
            <span className="px-2 py-0.5 rounded-full bg-muted text-foreground capitalize">
              {entry.mood}
            </span>
          )}
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit entry"
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="size-3.5" />
          </button>
          <form action={deleteJournalEntry}>
            <input type="hidden" name="id" value={entry.id} />
            <SubmitIconButton
              icon={Trash2}
              ariaLabel="Delete entry"
              className="p-1 text-muted-foreground hover:text-destructive"
            />
          </form>
        </div>
      </header>
      <div className="prose-paper">
        <p
          className={
            isLong && !expanded
              ? "whitespace-pre-wrap leading-relaxed line-clamp-6"
              : "whitespace-pre-wrap leading-relaxed"
          }
        >
          {entry.body}
        </p>
        {isLong && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </article>
  );
}
