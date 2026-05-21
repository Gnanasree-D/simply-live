"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const HOLD_MS = 1400;

export function useRequestPending(): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const hideRef = useRef<number | undefined>(undefined);
  const initial = useRef(true);

  useEffect(() => {
    if (initial.current) {
      initial.current = false;
      return;
    }
    setPending(true);
    window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(() => setPending(false), 350);
  }, [pathname, searchParams]);

  useEffect(() => {
    function ping() {
      setPending(true);
      window.clearTimeout(hideRef.current);
      hideRef.current = window.setTimeout(() => setPending(false), HOLD_MS);
    }
    function handleClick(e: MouseEvent) {
      const target = (e.target as Element | null)?.closest("a, button");
      if (!target) return;
      if (target instanceof HTMLAnchorElement) {
        if (
          target.target === "_blank" ||
          target.hasAttribute("download") ||
          target.dataset.noProgress === "true"
        ) {
          return;
        }
        const href = target.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
      } else if (target instanceof HTMLButtonElement) {
        if (target.type !== "submit") return;
      }
      ping();
    }
    function handleSubmit() {
      ping();
    }
    document.addEventListener("click", handleClick, true);
    document.addEventListener("submit", handleSubmit, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      document.removeEventListener("submit", handleSubmit, true);
      window.clearTimeout(hideRef.current);
    };
  }, []);

  return pending;
}
