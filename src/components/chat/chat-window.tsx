"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { MessageInput } from "@/components/chat/message-input";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { GroupPhotoDialog } from "@/components/chat/group-photo-dialog";
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
  onReact,
  onBack,
  onSetTheme,
  onSetBackgroundPhoto,
  onSetGroupAvatarKey,
  onSetGroupAvatarPhoto,
}: {
  thread: Thread;
  messages: Message[];
  currentUser: Profile;
  onSend: (body: string, replyToId: string | null) => Promise<void>;
  onSendAttachment: (file: File) => Promise<void>;
  onMarkRead: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
  onBack: () => void;
  onSetTheme: (theme: string | null) => Promise<void>;
  onSetBackgroundPhoto: (file: File) => Promise<void>;
  onSetGroupAvatarKey: (key: string) => Promise<void>;
  onSetGroupAvatarPhoto: (file: File) => Promise<void>;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const backgroundPhotoUrl = useSignedUrl(thread.background_url);
  const theme = findChatTheme(thread.theme);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

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
  const messagesById = Object.fromEntries(messages.map((m) => [m.id, m]));
  const other = thread.participants.find((p) => p.id !== currentUser.id);
  const headerAvatarId = thread.is_group ? thread.id : (other?.id ?? thread.id);
  const headerAvatarKey = thread.is_group ? thread.avatar_key : other?.avatar_key;
  const headerAvatarUrl = thread.is_group ? thread.avatar_url : other?.avatar_url;

  const backgroundStyle: React.CSSProperties = theme
    ? {
        backgroundImage: `${theme.pattern}, ${theme.gradient}`,
        backgroundRepeat: "repeat, no-repeat",
        backgroundSize: `${theme.patternSize}px ${theme.patternSize}px, cover`,
      }
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
        {thread.is_group ? (
          <GroupPhotoDialog
            thread={thread}
            onSetAvatarKey={onSetGroupAvatarKey}
            onSetAvatarPhoto={onSetGroupAvatarPhoto}
            trigger={
              <button type="button" className="rounded-full">
                <FunAvatar id={headerAvatarId} avatarKey={headerAvatarKey} avatarUrl={headerAvatarUrl} size="sm" />
              </button>
            }
          />
        ) : (
          <FunAvatar id={headerAvatarId} avatarKey={headerAvatarKey} avatarUrl={headerAvatarUrl} size="sm" />
        )}
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
            {messages.map((m) => {
              const repliedToMessage = m.reply_to_id ? messagesById[m.reply_to_id] : undefined;
              return (
                <MessageBubble
                  key={m.id}
                  message={m}
                  isOwn={m.sender_id === currentUser.id}
                  sender={participantsById[m.sender_id]}
                  participants={thread.participants}
                  readByOthers={m.readBy.filter((id) => id !== currentUser.id)}
                  currentUserId={currentUser.id}
                  repliedToMessage={repliedToMessage}
                  repliedToSender={
                    repliedToMessage ? participantsById[repliedToMessage.sender_id] : undefined
                  }
                  onReact={(emoji) => onReact(m.id, emoji)}
                  onReply={() => setReplyingTo(m)}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      </div>
      <MessageInput
        onSend={onSend}
        onSendAttachment={onSendAttachment}
        participants={thread.participants.filter((p) => p.id !== currentUser.id)}
        replyingTo={replyingTo}
        replyingToSender={replyingTo ? participantsById[replyingTo.sender_id] : undefined}
        onCancelReply={() => setReplyingTo(null)}
      />
    </div>
  );
}
