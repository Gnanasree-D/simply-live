"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-context";
import { pullState, startSyncEngine } from "./sync-engine";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [syncReady, setSyncReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.replace("/sign-in");
      return;
    }
    let stopWatching: (() => void) | undefined;
    (async () => {
      try {
        await pullState(session);
      } catch (err) {
        console.warn("[sync] initial pull failed:", err);
      }
      stopWatching = startSyncEngine(session);
      setSyncReady(true);
    })();
    return () => {
      stopWatching?.();
      setSyncReady(false);
    };
  }, [ready, session, router]);

  if (!ready) return null;
  if (!session) return null;
  if (!syncReady) {
    return (
      <main className="flex flex-1 items-center justify-center px-6">
        <p className="text-sm text-muted-foreground">Syncing your data…</p>
      </main>
    );
  }
  return <>{children}</>;
}
