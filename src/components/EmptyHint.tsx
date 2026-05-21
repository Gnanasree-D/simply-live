import { cn } from "@/lib/utils";

export function EmptyHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5",
        className,
      )}
    >
      <p className="text-muted-foreground text-sm leading-relaxed">
        {children}
      </p>
    </div>
  );
}
