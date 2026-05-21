"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { Loader2, Trash2, X } from "lucide-react";
import type { TodoEntry } from "@/core/entry/schema";
import { toInputDate } from "@/core/time/day";
import {
  deleteTodo,
  updateTodo,
  type TodoState,
} from "@/features/todos/actions";

const initial: TodoState = {};

export function MilestoneQuickEdit({
  todo,
  onClose,
}: {
  todo: TodoEntry;
  onClose: () => void;
}) {
  const [state, action, savePending] = useActionState(updateTodo, initial);
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
      fd.append("id", todo.id);
      await deleteTodo(fd);
      onClose();
    });
  }

  const anyPending = savePending || deletePending;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit milestone"
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
    >
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/35 backdrop-blur-sm cursor-default"
      />
      <div className="relative w-full max-w-md rounded-lg border border-border bg-card shadow-xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
          <X className="size-4" />
        </button>

        <form action={action} className="p-5 space-y-4">
          <h2 className="font-serif text-lg pr-8">Edit milestone</h2>
          <input type="hidden" name="id" value={todo.id} />
          {todo.goalRefs.map((g) => (
            <input key={g} type="hidden" name="goalRefs" value={g} />
          ))}

          <input
            ref={titleRef}
            name="title"
            type="text"
            required
            maxLength={120}
            defaultValue={todo.title}
            aria-label="Milestone title"
            className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
          />

          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="uppercase tracking-wider">Due</span>
            <input
              name="due"
              type="date"
              defaultValue={todo.due ? toInputDate(todo.due) : ""}
              className="bg-transparent border-0 text-foreground focus:outline-none text-sm"
            />
          </label>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={handleDelete}
              disabled={anyPending}
              aria-label="Delete milestone"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-destructive hover:border-destructive transition-colors disabled:opacity-50"
            >
              {deletePending ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="size-3.5" aria-hidden="true" />
              )}
              {deletePending ? "Deleting…" : "Delete"}
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={anyPending}
                className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={anyPending}
                className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savePending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
