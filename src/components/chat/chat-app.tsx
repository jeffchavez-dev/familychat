"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/lib/supabase/use-presence";
import { cn } from "@/lib/utils";
import {
  createThread,
  fetchMessages,
  fetchThreads,
  markMessageRead,
  sendMessage,
  setThreadBackgroundPhoto,
  setThreadTheme,
  uploadAttachment,
} from "@/lib/supabase/queries";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import type { Message, Profile, Thread } from "@/lib/types";

export function ChatApp({
  currentUser,
  allProfiles,
}: {
  currentUser: Profile;
  allProfiles: Profile[];
}) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const onlineIds = usePresence(currentUser.id);

  useEffect(() => {
    fetchThreads().then((t) => {
      setThreads(t);
      if (t.length > 0) setSelectedThreadId((prev) => prev ?? t[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedThreadId) return;
    fetchMessages(selectedThreadId).then(setMessages);

    const supabase = createClient();
    const channel = supabase
      .channel(`thread-${selectedThreadId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${selectedThreadId}`,
        },
        (payload) => {
          const m = payload.new as Omit<Message, "readBy">;
          setMessages((prev) => [...prev, { ...m, readBy: [] }]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reads",
        },
        (payload) => {
          const { message_id, user_id } = payload.new as {
            message_id: string;
            user_id: string;
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === message_id && !m.readBy.includes(user_id)
                ? { ...m, readBy: [...m.readBy, user_id] }
                : m,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "threads",
          filter: `id=eq.${selectedThreadId}`,
        },
        (payload) => {
          const { theme, background_url } = payload.new as {
            theme: string | null;
            background_url: string | null;
          };
          setThreads((prev) =>
            prev.map((t) => (t.id === selectedThreadId ? { ...t, theme, background_url } : t)),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThreadId]);

  const handleCreateThread = useCallback(
    async (otherUserIds: string[], name: string | null) => {
      const threadId = await createThread(currentUser.id, otherUserIds, name);
      const updated = await fetchThreads();
      setThreads(updated);
      setSelectedThreadId(threadId);
    },
    [currentUser.id],
  );

  const handleSend = useCallback(
    async (body: string) => {
      if (!selectedThreadId) return;
      await sendMessage({ threadId: selectedThreadId, senderId: currentUser.id, body });
    },
    [selectedThreadId, currentUser.id],
  );

  const handleSendAttachment = useCallback(
    async (file: File) => {
      if (!selectedThreadId) return;
      const { path, type } = await uploadAttachment(selectedThreadId, file);
      await sendMessage({
        threadId: selectedThreadId,
        senderId: currentUser.id,
        body: null,
        attachmentUrl: path,
        attachmentType: type,
      });
    },
    [selectedThreadId, currentUser.id],
  );

  const handleMarkRead = useCallback(
    (messageId: string) => {
      markMessageRead(messageId, currentUser.id);
    },
    [currentUser.id],
  );

  const handleSetTheme = useCallback(
    async (theme: string | null) => {
      if (!selectedThreadId) return;
      await setThreadTheme(selectedThreadId, theme);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThreadId ? { ...t, theme, background_url: null } : t,
        ),
      );
    },
    [selectedThreadId],
  );

  const handleSetBackgroundPhoto = useCallback(
    async (file: File) => {
      if (!selectedThreadId) return;
      const path = await setThreadBackgroundPhoto(selectedThreadId, file);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThreadId ? { ...t, background_url: path, theme: null } : t,
        ),
      );
    },
    [selectedThreadId],
  );

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <div className={cn("w-full shrink-0 md:block md:w-72", selectedThreadId ? "hidden md:block" : "block")}>
        <Sidebar
          currentUser={currentUser}
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelectThread={setSelectedThreadId}
          onlineIds={onlineIds}
          members={allProfiles}
          onCreateThread={handleCreateThread}
        />
      </div>
      <div className={cn("min-w-0 flex-1", selectedThreadId ? "block" : "hidden md:block")}>
        {selectedThread ? (
          <ChatWindow
            thread={selectedThread}
            messages={messages}
            currentUser={currentUser}
            onSend={handleSend}
            onSendAttachment={handleSendAttachment}
            onMarkRead={handleMarkRead}
            onBack={() => setSelectedThreadId(null)}
            onSetTheme={handleSetTheme}
            onSetBackgroundPhoto={handleSetBackgroundPhoto}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-5xl">👋</span>
            <p className="font-heading text-xl text-foreground">
              Start a new chat to get going!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
