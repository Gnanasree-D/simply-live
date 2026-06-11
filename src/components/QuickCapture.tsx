"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Plus, X } from "lucide-react";
import {
  createJournalEntry,
  type JournalState,
} from "@/features/journal/actions";
import { createTodo, type TodoState } from "@/features/todos/actions";
import { cn } from "@/lib/utils";

const journalInitial: JournalState = {};
const todoInitial: TodoState = {};

type Mode = "journal" | "todo";

export function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("journal");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick capture"
        className="fixed bottom-20 right-6 z-40 size-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 transition-opacity flex items-center justify-center md:bottom-6"
      >
        <Plus className="size-5" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quick capture"
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={close}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm cursor-default"
          />
          <div className="relative w-full max-w-lg rounded-lg border border-border bg-card shadow-xl">
            <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
              <div className="flex gap-1">
                <ModeTab
                  active={mode === "journal"}
                  onClick={() => setMode("journal")}
                >
                  Journal
                </ModeTab>
                <ModeTab
                  active={mode === "todo"}
                  onClick={() => setMode("todo")}
                >
                  To-Do
                </ModeTab>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </header>

            {mode === "journal" ? (
              <JournalQuickForm onSuccess={close} />
            ) : (
              <TodoQuickForm onSuccess={close} />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md px-3 py-1 text-sm transition-colors",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function JournalQuickForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, pending] = useActionState(
    createJournalEntry,
    journalInitial,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state, onSuccess]);

  function onKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.currentTarget.requestSubmit();
    }
  }

  return (
    <form action={action} onKeyDown={onKeyDown} className="p-4 space-y-3">
      <textarea
        ref={textareaRef}
        name="body"
        rows={5}
        required
        placeholder="What's on your mind?"
        className="w-full resize-none border-0 bg-transparent focus:outline-none text-base leading-relaxed prose-paper placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Ctrl / ⌘ + Enter to save</span>
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
  );
}

function TodoQuickForm({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, pending] = useActionState(createTodo, todoInitial);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (state.ok) onSuccess();
  }, [state, onSuccess]);

  return (
    <form action={action} className="p-4 space-y-3">
      <input
        ref={inputRef}
        name="title"
        type="text"
        required
        placeholder="What needs doing?"
        className="w-full border-0 bg-transparent focus:outline-none text-base placeholder:text-muted-foreground"
      />
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">Enter to save</span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
