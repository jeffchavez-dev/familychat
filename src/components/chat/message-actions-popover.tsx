"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { REACTION_EMOJIS } from "@/lib/emoji";
import { cn } from "@/lib/utils";

export function MessageActionsPopover({
  isOwn,
  onReact,
  onReply,
  children,
}: {
  isOwn: boolean;
  onReact: (emoji: string) => void;
  onReply: () => void;
  children: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={children} />
      <PopoverContent
        side="top"
        align={isOwn ? "end" : "start"}
        className="w-auto p-2"
      >
        <div className="flex items-center gap-1">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onReact(emoji);
                setOpen(false);
              }}
              className="rounded-full p-1 text-lg transition-transform hover:scale-125 active:scale-95"
            >
              {emoji}
            </button>
          ))}
          <div className="mx-1 h-6 w-px bg-border" />
          <button
            type="button"
            onClick={() => {
              onReply();
              setOpen(false);
            }}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-foreground hover:bg-muted",
            )}
          >
            ↩️ Reply
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
