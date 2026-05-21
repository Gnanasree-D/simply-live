"use client";

import { useOptimistic, useTransition } from "react";
import { Droplet } from "lucide-react";
import { logWater } from "../actions";
import { cn } from "@/lib/utils";

export function WaterButton({ currentCups }: { currentCups: number }) {
  const [optimisticCups, addOptimistic] = useOptimistic(
    currentCups,
    (state, _: void) => state + 1,
  );
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      addOptimistic();
      await logWater();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={cn(
        "group flex items-center gap-3 rounded-lg border-2 px-5 py-4 bg-card hover:border-primary transition-all disabled:opacity-60",
        "border-border",
      )}
    >
      <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
        <Droplet className="size-5" fill="currentColor" aria-hidden="true" />
      </div>
      <div className="text-left">
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-2xl tabular-nums">
            {optimisticCups}
          </span>
          <span className="text-xs text-muted-foreground">
            {optimisticCups === 1 ? "cup" : "cups"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Tap to log a cup
        </p>
      </div>
    </button>
  );
}
