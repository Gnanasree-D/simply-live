"use client";

import { useFormStatus } from "react-dom";
import { LogOut } from "lucide-react";
import { signOutAction } from "../actions";

function Button() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-md border border-foreground px-2.5 py-1 text-xs uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <LogOut className="size-3" aria-hidden="true" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button />
    </form>
  );
}
