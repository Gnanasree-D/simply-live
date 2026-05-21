import { auth } from "@/lib/auth";
import { getInsights } from "@/features/insights/queries";
import { WeekdayBars } from "@/features/insights/components/WeekdayBars";
import { TopTags } from "@/features/insights/components/TopTags";
import { GoalMomentumRow } from "@/features/insights/components/GoalMomentumRow";
import { MoodMix } from "@/features/insights/components/MoodMix";
import { WorkoutWeekdays } from "@/features/insights/components/WorkoutWeekdays";
import { BodyTrendBars } from "@/features/insights/components/BodyTrendBars";
import { EmptyHint } from "@/components/EmptyHint";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const data = await getInsights(session.user.id);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-10">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Insights
        </p>
        <h1 className="mt-3 font-serif text-3xl leading-tight">
          The shape of your weeks.
        </h1>
        <p className="mt-3 text-muted-foreground text-sm">
          A few quiet patterns from the last twelve weeks of your notebook.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-2">Best days</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Habit completion rate by weekday · last 12 weeks
        </p>
        <div className="rounded-lg border border-border bg-card p-5">
          <WeekdayBars data={data.weekdayConsistency} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-2">Top tags</h2>
        <p className="text-xs text-muted-foreground mb-4">
          What keeps showing up
        </p>
        <div className="rounded-lg border border-border bg-card p-5">
          <TopTags tags={data.topTags} />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-2">Goal momentum</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Linked entries per week, last four weeks
        </p>
        {data.goalMomentum.length === 0 ? (
          <EmptyHint>
            No goals tracked yet — add one to see momentum.
          </EmptyHint>
        ) : (
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {data.goalMomentum.map((g) => (
              <GoalMomentumRow key={g.id} goal={g} />
            ))}
          </div>
        )}
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-2">Workout days</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Which days you tend to train · last 12 weeks
        </p>
        <div className="rounded-lg border border-border bg-card p-5">
          <WorkoutWeekdays
            data={data.body.workoutsByWeekday}
            totalWorkouts={data.body.totalWorkouts}
            totalMinutes={data.body.totalWorkoutMinutes}
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-2">Food trend</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Entries per week · mint = clean, red = junk · last 4 weeks
        </p>
        <div className="rounded-lg border border-border bg-card p-5">
          <BodyTrendBars
            weeks={data.body.weeks}
            weeklyJunkRatio={data.body.weeklyJunkRatio}
            totalFood={data.body.totalFood}
            totalJunk={data.body.totalJunk}
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-serif text-xl mb-2">Mood mix</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Across {data.totalMoodEntries}{" "}
          {data.totalMoodEntries === 1 ? "journal entry" : "journal entries"}
        </p>
        <div className="rounded-lg border border-border bg-card p-5">
          <MoodMix slices={data.moodMix} total={data.totalMoodEntries} />
        </div>
      </section>
    </main>
  );
}
