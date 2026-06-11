"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SubTabs({
  tabs,
}: {
  tabs: { href: string; label: string }[];
}) {
  const raw = usePathname();
  const pathname = raw.length > 1 ? raw.replace(/\/$/, "") : raw;

  return (
    <div className="border-b border-border">
      <nav className="mx-auto w-full max-w-5xl px-6 flex gap-x-5 text-sm overflow-x-auto">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative py-3 whitespace-nowrap transition-colors",
                active
                  ? "text-foreground font-medium after:absolute after:left-0 after:right-0 after:-bottom-px after:h-0.5 after:bg-primary after:rounded-full"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
