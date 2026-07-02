"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageInput } from "@/components/chat/message-input";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { ThemeDialog } from "@/components/chat/theme-dialog";
import { threadTitle } from "@/components/chat/thread-title";
import { findChatTheme } from "@/lib/chat-themes";
import { useSignedUrl } from "@/lib/supabase/use-signed-url";
import type { Message, Profile, Thread } from "@/lib/types";

export function ChatWindow({
  thread,
  messages,
  currentUser,
  onSend,
  onSendAttachment,
  onMarkRead,
  onBack,
  onSetTheme,
  onSetBackgroundPhoto,
}: {
  thread: Thread;
  messages: Message[];
  currentUser: Profile;
  onSend: (body: string) => Promise<void>;
  onSendAttachment: (file: File) => Promise<void>;
  onMarkRead: (messageId: string) => void;
  onBack: () => void;
  onSetTheme: (theme: string | null) => Promise<void>;
  onSetBackgroundPhoto: (file: File) => Promise<void>;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const backgroundPhotoUrl = useSignedUrl(thread.background_url);
  const theme = findChatTheme(thread.theme);

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

  const backgroundStyle: React.CSSProperties = theme
    ? { background: theme.gradient }
    : backgroundPhotoUrl
      ? {
          backgroundImage: `url(${backgroundPhotoUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }
      : {};

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b bg-card/60 p-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-1 rounded-full text-lg md:hidden"
          onClick={onBack}
          aria-label="Back to chats"
        >
          ←
        </Button>
        <FunAvatar
          id={other?.id ?? thread.id}
          avatarKey={other?.avatar_key}
          avatarUrl={other?.avatar_url}
          size="sm"
        />
        <h2 className="font-heading text-lg text-foreground">
          {threadTitle(thread, currentUser.id)}
        </h2>
        <ThemeDialog
          currentTheme={thread.theme}
          hasBackgroundPhoto={!!thread.background_url}
          onSetTheme={onSetTheme}
          onSetBackgroundPhoto={onSetBackgroundPhoto}
        />
      </div>
      <div className="relative flex-1 overflow-hidden" style={backgroundStyle}>
        {thread.background_url && <div className="absolute inset-0 bg-background/45" />}
        <ScrollArea className="relative h-full p-4">
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
      </div>
      <MessageInput onSend={onSend} onSendAttachment={onSendAttachment} />
    </div>
  );
}
