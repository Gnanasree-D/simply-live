"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequestPending } from "./useRequestPending";
import { ThemeToggle } from "./ThemeToggle";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/today", label: "Today" },
  { href: "/plan", label: "Plan" },
  { href: "/body", label: "Body" },
  { href: "/progress", label: "Progress" },
];

function stripSlash(p: string): string {
  return p.length > 1 ? p.replace(/\/$/, "") : p;
}

// Goals detail lives outside the tab tree but belongs to Plan.
function isActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (pathname.startsWith(href + "/")) return true;
  if (href === "/plan" && pathname.startsWith("/goals")) return true;
  return false;
}

export function AppNav() {
  const [open, setOpen] = useState(false);
  const rawPathname = usePathname();
  const pathname = stripSlash(rawPathname);
  const pending = useRequestPending();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-b border-border">
      <nav className="mx-auto w-full max-w-5xl px-6 py-3 flex items-center justify-between gap-x-6">
        <Link
          href="/today"
          aria-busy={pending}
          className={cn(
            "font-serif text-lg shrink-0 transition-opacity",
            pending && "brand-pulse",
          )}
        >
          SimplyLive
        </Link>

        <div className="hidden md:flex flex-1 items-center justify-end gap-x-5 text-sm">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-1 transition-colors",
                  active
                    ? "text-foreground font-medium after:absolute after:left-0 after:right-0 after:-bottom-[14px] after:h-0.5 after:bg-primary after:rounded-full"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <ThemeToggle />
          <SignOutButton />
        </div>

        <div className="flex items-center gap-x-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex items-center justify-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <ul className="mx-auto w-full max-w-5xl px-6 py-3 flex flex-col text-sm">
            {NAV_LINKS.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block py-2 pl-3 -ml-3 border-l-2 transition-colors",
                      active
                        ? "text-foreground font-medium border-primary"
                        : "text-muted-foreground hover:text-foreground border-transparent",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 pt-3 border-t border-border">
              <SignOutButton />
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
