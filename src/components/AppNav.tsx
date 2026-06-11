"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, HeartPulse, NotebookPen, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRequestPending } from "./useRequestPending";
import { ThemeToggle } from "./ThemeToggle";
import { SignOutButton } from "@/features/auth/components/SignOutButton";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/today", label: "Today", icon: Sun },
  { href: "/plan", label: "Plan", icon: NotebookPen },
  { href: "/body", label: "Body", icon: HeartPulse },
  { href: "/progress", label: "Progress", icon: BarChart3 },
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
  const rawPathname = usePathname();
  const pathname = stripSlash(rawPathname);
  const pending = useRequestPending();

  return (
    <>
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

          <div className="flex items-center gap-x-2 md:hidden">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </nav>
      </header>

      <nav
        aria-label="Primary"
        className="md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="flex">
          {NAV_LINKS.map((link) => {
            const active = isActive(pathname, link.href);
            const Icon = link.icon;
            return (
              <li key={link.href} className="flex-1">
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
