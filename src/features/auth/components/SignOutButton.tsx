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
      aria-label="Sign out"
      title="Sign out"
      className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <LogOut className="size-4" aria-hidden="true" />
    </button>
  );
}
