"use client";

import { Trash2 } from "lucide-react";
import type { FoodEntry } from "@/core/entry/schema";
import { cn } from "@/lib/utils";
import { SubmitIconButton } from "@/components/SubmitIconButton";
import { deleteFood } from "../actions";

function timeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

const MEAL_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export function FoodCard({ food }: { food: FoodEntry }) {
  return (
    <article
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-3 transition-colors",
        food.isJunk
          ? "border-destructive/30"
          : "border-border",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-foreground leading-relaxed">{food.name}</p>
          {food.isJunk && (
            <span className="text-[10px] uppercase tracking-wider rounded-full bg-destructive/15 text-destructive px-2 py-0.5">
              Junk
            </span>
          )}
          {food.meal && (
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {MEAL_LABEL[food.meal]}
            </span>
          )}
        </div>
        {food.notes && (
          <p className="mt-1 text-xs text-muted-foreground">{food.notes}</p>
        )}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
        {timeLabel(food.createdAt)}
      </span>
      <form action={deleteFood}>
        <input type="hidden" name="id" value={food.id} />
        <SubmitIconButton
          icon={Trash2}
          ariaLabel="Delete food entry"
          iconClassName="size-3.5"
          className="p-1 text-muted-foreground hover:text-destructive"
        />
      </form>
    </article>
  );
}
