"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageInput } from "@/components/chat/message-input";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { threadTitle } from "@/components/chat/thread-title";
import type { Message, Profile, Thread } from "@/lib/types";

export function ChatWindow({
  thread,
  messages,
  currentUser,
  onSend,
  onSendAttachment,
  onMarkRead,
}: {
  thread: Thread;
  messages: Message[];
  currentUser: Profile;
  onSend: (body: string) => Promise<void>;
  onSendAttachment: (file: File) => Promise<void>;
  onMarkRead: (messageId: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    for (const m of messages) {
      if (m.sender_id !== currentUser.id && !m.readBy.includes(currentUser.id)) {
        onMarkRead(m.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const participantsById = Object.fromEntries(
    thread.participants.map((p) => [p.id, p]),
  );
  const other = thread.participants.find((p) => p.id !== currentUser.id);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b bg-card/60 p-3">
        <FunAvatar id={other?.id ?? thread.id} size="sm" />
        <h2 className="font-heading text-lg text-foreground">
          {threadTitle(thread, currentUser.id)}
        </h2>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              isOwn={m.sender_id === currentUser.id}
              sender={participantsById[m.sender_id]}
              readByOthers={m.readBy.filter((id) => id !== currentUser.id)}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
      <MessageInput onSend={onSend} onSendAttachment={onSendAttachment} />
    </div>
  );
}
