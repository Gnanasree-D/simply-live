"use client";

import { useActionState, useEffect, useRef } from "react";
import { createBlock, type BlockState } from "../actions";

const initial: BlockState = {};

export function BlockQuickAdd({
  defaultDate,
  defaultStartTime,
  defaultEndTime,
  onClose,
}: {
  defaultDate: string;
  defaultStartTime: string;
  defaultEndTime: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState(createBlock, initial);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add block"
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
          <h2 className="font-serif text-lg">Add block</h2>
          <input
            ref={titleRef}
            name="title"
            type="text"
            required
            maxLength={80}
            placeholder="What are you planning?"
            className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
          />
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wider">Date</span>
              <input
                name="date"
                type="date"
                required
                defaultValue={defaultDate}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wider">Start</span>
              <input
                name="startTime"
                type="time"
                required
                defaultValue={defaultStartTime}
                className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
              />
            </label>
            <label className="flex items-center gap-2">
              <span className="uppercase tracking-wider">End</span>
              <input
                name="endTime"
                type="time"
                required
                defaultValue={defaultEndTime}
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
              disabled={pending}
              className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
          {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        </form>
      </div>
    </div>
  );
}
