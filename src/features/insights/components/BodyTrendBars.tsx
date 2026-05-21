import type { BodyTrendWeek } from "@/core/insights/compute";

export function BodyTrendBars({
  weeks,
  weeklyJunkRatio,
  totalFood,
  totalJunk,
}: {
  weeks: BodyTrendWeek[];
  weeklyJunkRatio: number;
  totalFood: number;
  totalJunk: number;
}) {
  if (totalFood === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No food entries yet. Open Food to log a meal.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-end gap-3 h-20">
        {weeks.map((w, i) => {
          const total = w.foodEntries;
          const junk = w.junkEntries;
          const maxBarHeight = 72;
          const totalH = total === 0
            ? 0
            : Math.max(8, (total / Math.max(...weeks.map((wk) => wk.foodEntries), 1)) * maxBarHeight);
          const junkH = total === 0 ? 0 : (junk / total) * totalH;
          const cleanH = totalH - junkH;
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full flex flex-col-reverse"
                style={{ height: maxBarHeight }}
                title={`Week of ${w.weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })}: ${total} entries, ${junk} junk`}
              >
                {total === 0 ? (
                  <div className="w-full h-2 bg-muted rounded-sm" />
                ) : (
                  <>
                    {junkH > 0 && (
                      <div
                        className="w-full bg-destructive rounded-b-sm"
                        style={{ height: junkH }}
                      />
                    )}
                    {cleanH > 0 && (
                      <div
                        className="w-full bg-[var(--accent-mint)] rounded-t-sm"
                        style={{ height: cleanH }}
                      />
                    )}
                  </>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                {total}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2">
        {weeks.map((w, i) => (
          <p
            key={i}
            className="flex-1 text-center text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {i === weeks.length - 1
              ? "this wk"
              : w.weekStart.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{totalFood}</span> entries
        ·{" "}
        <span className="text-destructive">
          {totalJunk} junk ({Math.round(weeklyJunkRatio * 100)}%)
        </span>{" "}
        across last 4 weeks
      </p>
    </div>
  );
}
