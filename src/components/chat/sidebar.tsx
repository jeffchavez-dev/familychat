"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { NewThreadDialog } from "@/components/chat/new-thread-dialog";
import { LogoutButton } from "@/components/chat/logout-button";
import { EnablePushButton } from "@/components/chat/enable-push-button";
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
    <aside className="flex w-72 shrink-0 flex-col border-r bg-muted/20">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{currentUser.full_name[0]}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{currentUser.full_name}</span>
        </div>
        <LogoutButton />
      </div>
      <Separator />
      <div className="space-y-2 p-3">
        <NewThreadDialog
          members={members.filter((m) => m.id !== currentUser.id)}
          onCreate={onCreateThread}
        />
        <EnablePushButton userId={currentUser.id} />
      </div>
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {threads.map((thread) => {
          const other = thread.participants.find((p) => p.id !== currentUser.id);
          const isOnline = other ? onlineIds.has(other.id) : false;
          return (
            <button
              key={thread.id}
              onClick={() => onSelectThread(thread.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-muted",
                selectedThreadId === thread.id && "bg-muted",
              )}
            >
              <div className="relative">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {threadTitle(thread, currentUser.id)[0]}
                  </AvatarFallback>
                </Avatar>
                {!thread.is_group && isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-green-500" />
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
