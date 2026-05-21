"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Copy, Loader2 } from "lucide-react";
import { useAuth } from "@/features/sync/auth-context";

type Step =
  | { kind: "form" }
  | { kind: "showRecovery"; recoveryKey: string };

export default function SignUpPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [step, setStep] = useState<Step>({ kind: "form" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setPending(true);
    try {
      const { recoveryKey } = await signup(email.trim(), password);
      setStep({ kind: "showRecovery", recoveryKey });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setPending(false);
    }
  }

  if (step.kind === "showRecovery") {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg border-2 border-amber-700/50 bg-card p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle
                className="size-5 text-amber-700 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-serif text-xl">Save your recovery key</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  This is the only way to recover your encrypted data if you
                  forget your password. We don&rsquo;t store it. Write it down
                  somewhere safe before continuing — it will <strong>never</strong>{" "}
                  be shown again.
                </p>
              </div>
            </div>
            <div className="mt-5 rounded-lg bg-muted p-4 font-mono text-base text-center tabular-nums break-all">
              {step.recoveryKey}
            </div>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(step.recoveryKey)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Copy className="size-3.5" aria-hidden="true" />
              Copy recovery key
            </button>
            <label className="mt-5 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-1"
              />
              <span className="text-muted-foreground leading-relaxed">
                I saved my recovery key somewhere safe. I understand that
                losing both my password and this key means my data is
                permanently unrecoverable.
              </span>
            </label>
            <button
              type="button"
              disabled={!acknowledged}
              onClick={() => router.replace("/today")}
              className="mt-5 w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Continue to SimplyLive
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground text-center">
          SimplyLive
        </p>
        <h1 className="mt-3 font-serif text-3xl text-center">
          Make an account.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          Your data is encrypted on your device with a key derived from your
          password. The server only stores opaque ciphertext.
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-lg border border-border bg-card p-6 space-y-4"
        >
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Email
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border-b border-border bg-transparent py-1 text-base focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Password (at least 8 characters)
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border-b border-border bg-transparent py-1 text-base focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              Confirm password
            </span>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full border-b border-border bg-transparent py-1 text-base focus:outline-none focus:border-primary"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {pending ? "Setting up…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
