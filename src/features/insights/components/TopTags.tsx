import type { TagCount } from "@/core/insights/compute";

export function TopTags({ tags }: { tags: TagCount[] }) {
  if (tags.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-6 text-center">
        No tags yet. Add #tags to journal entries or to-dos and they&rsquo;ll
        surface here.
      </p>
    );
  }
  const max = tags[0].count;
  return (
    <div className="space-y-2">
      {tags.map((t) => (
        <div key={t.tag} className="flex items-center gap-3">
          <span className="text-sm text-foreground w-32 truncate font-mono">
            #{t.tag}
          </span>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary/70"
              style={{ width: `${(t.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
            {t.count}
          </span>
        </div>
      ))}
    </div>
  );
}
