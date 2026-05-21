import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";
import { listJournalEntries } from "@/features/journal/queries";
import { JournalComposer } from "@/features/journal/components/JournalComposer";
import { JournalEntryCard } from "@/features/journal/components/JournalEntryCard";
import { listActiveGoalsLight } from "@/features/goals/queries";
import { EmptyHint } from "@/components/EmptyHint";

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const [entries, goals] = await Promise.all([
    listJournalEntries(session.user.id, { limit: 50 }),
    listActiveGoalsLight(session.user.id),
  ]);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-10">
      <header className="mb-8">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h1 className="font-serif text-3xl">Journal</h1>
          <Link
            href="/review"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Start weekly review
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
        <p className="text-muted-foreground text-sm mt-1">
          Your thoughts, in one quiet place.
        </p>
      </header>

      <JournalComposer goals={goals} />

      <section className="mt-8 space-y-4">
        {entries.length === 0 ? (
          <EmptyHint>
            No entries yet. Write your first thought above.
          </EmptyHint>
        ) : (
          entries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} goals={goals} />
          ))
        )}
      </section>
    </main>
  );
}
