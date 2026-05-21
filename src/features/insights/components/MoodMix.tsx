import type { MoodSlice } from "@/core/insights/compute";

const MOOD_COLORS: Record<MoodSlice["mood"], string> = {
  great: "bg-[var(--streak,#D4A95A)]",
  good: "bg-primary",
  okay: "bg-muted-foreground/40",
  low: "bg-muted-foreground/25",
  rough: "bg-[var(--destructive,#C97B5A)]/70",
};

const MOOD_LABELS: Record<MoodSlice["mood"], string> = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  low: "Low",
  rough: "Rough",
};

export function MoodMix({
  slices,
  total,
}: {
  slices: MoodSlice[];
  total: number;
}) {
  if (total === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No mood data yet. Tag your mood when journaling to see the mix here.
      </p>
    );
  }
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {slices.map((s) => {
          if (s.count === 0) return null;
          return (
            <div
              key={s.mood}
              className={MOOD_COLORS[s.mood]}
              style={{ width: `${(s.count / total) * 100}%` }}
              title={`${MOOD_LABELS[s.mood]}: ${s.count}`}
            />
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-5 gap-2">
        {slices.map((s) => (
          <div key={s.mood} className="text-center">
            <div
              className={`h-2 rounded-full mb-1 ${MOOD_COLORS[s.mood]} opacity-90`}
            />
            <span className="block text-[11px] text-muted-foreground">
              {MOOD_LABELS[s.mood]}
            </span>
            <span className="block text-xs tabular-nums">
              {total === 0 ? 0 : Math.round((s.count / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
