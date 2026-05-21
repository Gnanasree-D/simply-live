import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();
  if (session?.user?.id) redirect("/today");

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          SimplyLive
        </p>
        <h1 className="mt-6 font-serif text-5xl leading-tight">
          One quiet place where your goals, your day, and your thoughts talk to each other.
        </h1>
        <p className="mt-6 text-muted-foreground leading-relaxed">
          Journaling, habits, goals, and time — joined by a single thread.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
