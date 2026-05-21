import { startOfDay } from "@/core/time/day";

const DAY_MS = 86_400_000;

export interface StreakResult {
  current: number;
  longest: number;
  lastCompleted: Date | null;
}

export interface StreakOptions {
  now?: Date;
  // Either weekdays OR intervalDays (interval takes precedence if both set)
  weekdays?: number[];
  intervalDays?: number;
}

export function computeStreak(
  completions: Date[],
  options: StreakOptions = {},
): StreakResult {
  const now = options.now ?? new Date();

  if (completions.length === 0) {
    return { current: 0, longest: 0, lastCompleted: null };
  }

  if (options.intervalDays && options.intervalDays >= 1) {
    return computeStreakInterval(completions, options.intervalDays, now);
  }
  return computeStreakWeekdays(completions, options.weekdays, now);
}

function computeStreakWeekdays(
  completions: Date[],
  weekdays: number[] | undefined,
  now: Date,
): StreakResult {
  const expectsEveryDay =
    !weekdays || weekdays.length === 0 || weekdays.length === 7;
  const expectsDay = (d: Date) =>
    expectsEveryDay || weekdays!.includes(d.getDay());

  const completedDays = new Set(
    completions.map((c) => startOfDay(c).getTime()),
  );
  const lastCompleted = new Date(
    Math.max(...completions.map((c) => c.getTime())),
  );

  let current = 0;
  let cursor = startOfDay(now);
  if (expectsDay(cursor) && !completedDays.has(cursor.getTime())) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  let lookback = 365 * 2;
  while (lookback-- > 0) {
    if (expectsDay(cursor)) {
      if (completedDays.has(cursor.getTime())) current++;
      else break;
    }
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  const earliest = startOfDay(
    new Date(Math.min(...completions.map((c) => c.getTime()))),
  );
  const today = startOfDay(now);
  let longest = 0;
  let run = 0;
  let day = earliest;
  while (day.getTime() <= today.getTime()) {
    if (expectsDay(day)) {
      if (completedDays.has(day.getTime())) {
        run++;
        if (run > longest) longest = run;
      } else {
        run = 0;
      }
    }
    day = new Date(day.getTime() + DAY_MS);
  }

  return { current, longest, lastCompleted };
}

function computeStreakInterval(
  completions: Date[],
  intervalDays: number,
  now: Date,
): StreakResult {
  // Allow a 1-day grace beyond the interval before the streak breaks.
  const maxGap = intervalDays + 1;

  const days = Array.from(
    new Set(completions.map((c) => startOfDay(c).getTime())),
  ).sort((a, b) => a - b);

  const lastCompleted = new Date(days[days.length - 1]);

  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = (days[i] - days[i - 1]) / DAY_MS;
    if (gap >= 1 && gap <= maxGap) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  let current = 0;
  const todayStart = startOfDay(now).getTime();
  const gapFromToday = (todayStart - days[days.length - 1]) / DAY_MS;
  if (gapFromToday <= maxGap) {
    current = 1;
    for (let i = days.length - 2; i >= 0; i--) {
      const gap = (days[i + 1] - days[i]) / DAY_MS;
      if (gap >= 1 && gap <= maxGap) current++;
      else break;
    }
  }

  return { current, longest, lastCompleted };
}
