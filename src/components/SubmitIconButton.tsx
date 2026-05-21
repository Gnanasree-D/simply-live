"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitIconButtonProps {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  ariaLabel: string;
  className?: string;
  iconClassName?: string;
}

export function SubmitIconButton({
  icon: Icon,
  ariaLabel,
  className,
  iconClassName = "size-3.5",
}: SubmitIconButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={ariaLabel}
      aria-busy={pending}
      className={cn("transition-colors disabled:opacity-50", className)}
    >
      {pending ? (
        <Loader2 className={cn(iconClassName, "animate-spin")} aria-hidden={true} />
      ) : (
        <Icon className={iconClassName} aria-hidden={true} />
      )}
    </button>
  );
}
