import { cn } from "@/lib/utils";
import type { Reaction } from "@/lib/types";

export function ReactionPills({
  reactions,
  currentUserId,
  onToggle,
}: {
  reactions: Reaction[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;

  const grouped = new Map<string, string[]>();
  for (const r of reactions) {
    grouped.set(r.emoji, [...(grouped.get(r.emoji) ?? []), r.userId]);
  }

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {[...grouped.entries()].map(([emoji, userIds]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onToggle(emoji)}
          className={cn(
            "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs shadow-sm transition-transform hover:scale-105 active:scale-95",
            userIds.includes(currentUserId)
              ? "border-primary bg-primary/15"
              : "border-border bg-card/85",
          )}
        >
          <span>{emoji}</span>
          <span className="font-bold text-foreground">{userIds.length}</span>
        </button>
      ))}
    </div>
  );
}
