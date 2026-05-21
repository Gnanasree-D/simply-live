import type { WeekdayConsistency } from "@/core/insights/compute";
import { cn } from "@/lib/utils";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export function WeekdayBars({ data }: { data: WeekdayConsistency[] }) {
  const ordered = ORDER.map((i) => data[i]);
  const allZero = ordered.every((d) => d.expected === 0);

  if (allZero) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        Not enough habit history yet. Keep checking habits in for a couple of
        weeks and a weekday pattern will appear here.
      </p>
    );
  }

  const max = Math.max(...ordered.map((d) => d.rate), 0.001);
  const best = ordered.reduce((b, d) =>
    d.expected > 0 && d.rate > b.rate ? d : b,
  );
  const worst = ordered.reduce(
    (w, d) => (d.expected > 0 && d.rate < w.rate ? d : w),
    best,
  );

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 h-32 items-end">
        {ordered.map((d) => {
          const heightPct = d.expected === 0 ? 0 : (d.rate / max) * 100;
          const isBest = d === best && best.expected > 0;
          const isWorst = d === worst && worst.expected > 0 && worst !== best;
          return (
            <div
              key={d.weekday}
              className="flex flex-col items-center justify-end h-full"
            >
              <span className="text-[10px] font-mono text-muted-foreground mb-1 tabular-nums">
                {d.expected === 0 ? "—" : `${Math.round(d.rate * 100)}%`}
              </span>
              <div
                className={cn(
                  "w-full rounded-t-sm transition-colors",
                  isBest
                    ? "bg-primary"
                    : isWorst
                      ? "bg-muted-foreground/40"
                      : "bg-muted-foreground/20",
                )}
                style={{ height: `${Math.max(heightPct, 2)}%` }}
                title={
                  d.expected === 0
                    ? "No expectation"
                    : `${d.done}/${d.expected} expected`
                }
              />
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {ordered.map((d) => (
          <span
            key={d.weekday}
            className="text-xs text-center text-muted-foreground"
          >
            {LABELS[d.weekday]}
          </span>
        ))}
      </div>
      {best.expected > 0 && (
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
          You&rsquo;re most consistent on{" "}
          <span className="text-foreground">{LABELS[best.weekday]}</span>
          {worst !== best && worst.expected > 0 && (
            <>
              , and least on{" "}
              <span className="text-foreground">{LABELS[worst.weekday]}</span>
            </>
          )}
          .
        </p>
      )}
    </div>
  );
}
