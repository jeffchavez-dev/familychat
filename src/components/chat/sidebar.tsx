"use client";

import { Separator } from "@/components/ui/separator";
import { NewThreadDialog } from "@/components/chat/new-thread-dialog";
import { LogoutButton } from "@/components/chat/logout-button";
import { EnablePushButton } from "@/components/chat/enable-push-button";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { threadTitle } from "@/components/chat/thread-title";
import { cn } from "@/lib/utils";
import type { Profile, Thread } from "@/lib/types";

export function Sidebar({
  currentUser,
  threads,
  selectedThreadId,
  onSelectThread,
  onlineIds,
  members,
  onCreateThread,
}: {
  currentUser: Profile;
  threads: Thread[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onlineIds: Set<string>;
  members: Profile[];
  onCreateThread: (otherUserIds: string[], name: string | null) => Promise<void>;
}) {
  return (
    <aside className="flex h-full w-full shrink-0 flex-col bg-sidebar text-sidebar-foreground md:w-72">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <FunAvatar id={currentUser.id} size="sm" />
          <span className="font-heading text-base">{currentUser.full_name}</span>
        </div>
        <LogoutButton />
      </div>
      <Separator className="bg-sidebar-border" />
      <div className="space-y-2 p-3">
        <NewThreadDialog
          members={members.filter((m) => m.id !== currentUser.id)}
          onCreate={onCreateThread}
        />
        <EnablePushButton userId={currentUser.id} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {threads.map((thread) => {
          const other = thread.participants.find((p) => p.id !== currentUser.id);
          const isOnline = other ? onlineIds.has(other.id) : false;
          return (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-2xl px-2 py-2 text-left text-sm font-semibold transition-all hover:scale-[1.02] hover:bg-sidebar-accent active:scale-95",
                selectedThreadId === thread.id &&
                  "bg-sidebar-accent shadow-sm",
              )}
            >
              <div className="relative">
                <FunAvatar id={other?.id ?? thread.id} size="sm" />
                {!thread.is_group && isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 border-sidebar bg-green-400" />
                )}
              </div>
              <span className="truncate">{threadTitle(thread, currentUser.id)}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
