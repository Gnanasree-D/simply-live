"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryState,
} from "../actions";
import type { HabitCategoryView } from "../queries";

const initial: CategoryState = {};

export function CategoryManager({
  categories,
}: {
  categories: HabitCategoryView[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {categories.map((c) => (
        <CategoryPill key={c.id} category={c} />
      ))}
      {adding ? (
        <CategoryAddForm onDone={() => setAdding(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Plus className="size-3" /> Add category
        </button>
      )}
    </div>
  );
}

function CategoryPill({ category }: { category: HabitCategoryView }) {
  const [editing, setEditing] = useState(false);
  const [state, action, pending] = useActionState(updateCategory, initial);

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  if (editing) {
    return (
      <form action={action} className="inline-flex">
        <input type="hidden" name="id" value={category.id} />
        <input
          name="name"
          defaultValue={category.name}
          autoFocus
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          className="rounded-full border border-border bg-card px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring w-32"
        />
      </form>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="hover:text-foreground transition-colors"
      >
        {category.name}
      </button>
      <form action={deleteCategory}>
        <input type="hidden" name="id" value={category.id} />
        <button
          type="submit"
          aria-label={`Delete category ${category.name}`}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <X className="size-3" />
        </button>
      </form>
    </div>
  );
}

function CategoryAddForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(createCategory, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      onDone();
    }
  }, [state, onDone]);

  return (
    <form ref={formRef} action={action} className="inline-flex flex-col gap-1">
      <input
        name="name"
        autoFocus
        disabled={pending}
        placeholder="Category name"
        onKeyDown={(e) => {
          if (e.key === "Escape") onDone();
        }}
        className="rounded-full border border-border bg-card px-3 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring w-32"
      />
      {state.error && (
        <span className="text-xs text-destructive px-3">{state.error}</span>
      )}
    </form>
  );
}
