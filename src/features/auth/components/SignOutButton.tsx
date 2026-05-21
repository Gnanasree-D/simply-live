"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/features/sync/auth-context";

export function SignOutButton() {
  const { logout, session } = useAuth();
  const router = useRouter();

  if (!session) return null;

  return (
    <button
      type="button"
      onClick={() => {
        logout();
        router.replace("/sign-in");
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-foreground px-2.5 py-1 text-xs uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <LogOut className="size-3" aria-hidden="true" />
      Sign out
    </button>
  );
}
