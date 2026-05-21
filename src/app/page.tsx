import Link from "next/link";

export default function Home() {
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
          Journaling, habits, goals, and time — joined by a single thread. Your
          data is encrypted on your device; the server only sees opaque
          ciphertext.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/sign-up"
            className="rounded-lg bg-primary px-5 py-2.5 text-primary-foreground hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Create account
          </Link>
          <Link
            href="/sign-in"
            className="rounded-lg border border-foreground px-5 py-2.5 text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
