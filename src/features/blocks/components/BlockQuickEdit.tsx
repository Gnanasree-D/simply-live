"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { Trash2 } from "lucide-react";
import type { BlockEntry } from "@/core/entry/schema";
import { toInputDate, toInputTime } from "@/core/time/day";
import {
  deleteBlock,
  updateBlock,
  type BlockState,
} from "../actions";

const initial: BlockState = {};

export function BlockQuickEdit({
  block,
  onClose,
}: {
  block: BlockEntry;
  onClose: () => void;
}) {
  const [state, action, savePending] = useActionState(updateBlock, initial);
  const [deletePending, startDelete] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    titleRef.current?.select();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state, onClose]);

  function handleDelete() {
    startDelete(async () => {
      const fd = new FormData();
      fd.append("id", block.id);
      await deleteBlock(fd);
      onClose();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit block"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
        <form action={action} className="p-5 space-y-4">
          <input type="hidden" name="id" value={block.id} />
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg">Edit block</h2>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deletePending || savePending}
              aria-label="Delete block"
              className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
          <input
            ref={titleRef}
            name="title"
            type="text"
            required
            maxLength={80}
            defaultValue={block.title}
            className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wider">Date</span>
              <input
                name="date"
                type="date"
                required
                defaultValue={toInputDate(block.start)}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wider">Start</span>
              <input
                name="startTime"
                type="time"
                required
                defaultValue={toInputTime(block.start)}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wider">End</span>
              <input
                name="endTime"
                type="time"
                required
                defaultValue={toInputTime(block.end)}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savePending || deletePending}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savePending ? "Saving…" : "Save"}
            </button>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}
