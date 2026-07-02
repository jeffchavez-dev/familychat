"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/lib/supabase/use-presence";
import { cn } from "@/lib/utils";
import {
  createThread,
  fetchMessages,
  fetchThreads,
  markMessageRead,
  sendMessage,
  setProfileAvatarKey,
  setProfileAvatarPhoto,
  setThreadAvatarKey,
  setThreadAvatarPhoto,
  setThreadBackgroundPhoto,
  setThreadTheme,
  toggleReaction,
  updatePassword,
  uploadAttachment,
} from "@/lib/supabase/queries";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { EmojiShower } from "@/components/chat/emoji-shower";
import { BuzzerOverlay, type BuzzerRound, type BuzzerWinner } from "@/components/chat/buzzer-overlay";
import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { isEmojiOnly } from "@/lib/emoji";
import type { Message, Profile, Thread } from "@/lib/types";

export function ChatApp({
  currentUser,
  allProfiles,
}: {
  currentUser: Profile;
  allProfiles: Profile[];
}) {
  const [profile, setProfile] = useState(currentUser);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [shower, setShower] = useState<{ key: number; content: string } | null>(null);
  const [buzzerRound, setBuzzerRound] = useState<BuzzerRound | null>(null);
  const [buzzerWinner, setBuzzerWinner] = useState<BuzzerWinner | null>(null);
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const onlineIds = usePresence(profile.id);

  // Reset the buzzer game when switching threads. Adjusting state directly
  // during render (guarded by comparing against the last-seen thread) is
  // React's recommended pattern for this, instead of an effect.
  const [buzzerThreadId, setBuzzerThreadId] = useState(selectedThreadId);
  if (selectedThreadId !== buzzerThreadId) {
    setBuzzerThreadId(selectedThreadId);
    setBuzzerRound(null);
    setBuzzerWinner(null);
    setHasBuzzed(false);
  }

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
      .channel(`thread-${selectedThreadId}`, { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "start_round" }, (payload) => {
        setBuzzerRound(payload.payload as BuzzerRound);
        setBuzzerWinner(null);
        setHasBuzzed(false);
      })
      .on("broadcast", { event: "buzz" }, (payload) => {
        const winner = payload.payload as BuzzerWinner;
        setBuzzerWinner((prev) => {
          if (prev && prev.roundId === winner.roundId) return prev;
          const animalEmoji = AVATAR_PALETTE.find((p) => p.key === winner.animalKey)?.emoji;
          if (animalEmoji) setShower({ key: Date.now(), content: animalEmoji });
          return winner;
        });
      })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${selectedThreadId}`,
        },
        (payload) => {
          const m = payload.new as Omit<Message, "readBy" | "reactions">;
          setMessages((prev) => [...prev, { ...m, readBy: [], reactions: [] }]);
          if (m.body && isEmojiOnly(m.body)) {
            setShower({ key: Date.now(), content: m.body });
          }
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
        { event: "INSERT", schema: "public", table: "message_reactions" },
        (payload) => {
          const { message_id, user_id, emoji } = payload.new as {
            message_id: string;
            user_id: string;
            emoji: string;
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === message_id
                ? { ...m, reactions: [...m.reactions, { emoji, userId: user_id }] }
                : m,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "message_reactions" },
        (payload) => {
          const { message_id, user_id, emoji } = payload.old as {
            message_id: string;
            user_id: string;
            emoji: string;
          };
          setMessages((prev) =>
            prev.map((m) =>
              m.id === message_id
                ? {
                    ...m,
                    reactions: m.reactions.filter(
                      (r) => !(r.emoji === emoji && r.userId === user_id),
                    ),
                  }
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
          const { theme, background_url, avatar_key, avatar_url } = payload.new as {
            theme: string | null;
            background_url: string | null;
            avatar_key: string | null;
            avatar_url: string | null;
          };
          setThreads((prev) =>
            prev.map((t) =>
              t.id === selectedThreadId
                ? { ...t, theme, background_url, avatar_key, avatar_url }
                : t,
            ),
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [selectedThreadId]);

  const handleCreateThread = useCallback(
    async (otherUserIds: string[], name: string | null) => {
      const threadId = await createThread(profile.id, otherUserIds, name);
      const updated = await fetchThreads();
      setThreads(updated);
      setSelectedThreadId(threadId);
    },
    [profile.id],
  );

  const handleSend = useCallback(
    async (body: string, replyToId: string | null) => {
      if (!selectedThreadId) return;
      await sendMessage({ threadId: selectedThreadId, senderId: profile.id, body, replyToId });
    },
    [selectedThreadId, profile.id],
  );

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      toggleReaction(messageId, profile.id, emoji);
    },
    [profile.id],
  );

  const handleSendAttachment = useCallback(
    async (file: File) => {
      if (!selectedThreadId) return;
      const { path, type } = await uploadAttachment(selectedThreadId, file);
      await sendMessage({
        threadId: selectedThreadId,
        senderId: profile.id,
        body: null,
        attachmentUrl: path,
        attachmentType: type,
      });
    },
    [selectedThreadId, profile.id],
  );

  const handleMarkRead = useCallback(
    (messageId: string) => {
      markMessageRead(messageId, profile.id);
    },
    [profile.id],
  );

  const handleSetAvatarKey = useCallback(
    async (key: string) => {
      await setProfileAvatarKey(profile.id, key);
      setProfile((prev) => ({ ...prev, avatar_key: key, avatar_url: null }));
    },
    [profile.id],
  );

  const handleSetAvatarPhoto = useCallback(
    async (file: File) => {
      const path = await setProfileAvatarPhoto(profile.id, file);
      setProfile((prev) => ({ ...prev, avatar_url: path, avatar_key: null }));
    },
    [profile.id],
  );

  const handleChangePassword = useCallback(async (password: string) => {
    await updatePassword(password);
  }, []);

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

  const handleSetGroupAvatarKey = useCallback(
    async (key: string) => {
      if (!selectedThreadId) return;
      await setThreadAvatarKey(selectedThreadId, key);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThreadId ? { ...t, avatar_key: key, avatar_url: null } : t,
        ),
      );
    },
    [selectedThreadId],
  );

  const handleSetGroupAvatarPhoto = useCallback(
    async (file: File) => {
      if (!selectedThreadId) return;
      const path = await setThreadAvatarPhoto(selectedThreadId, file);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === selectedThreadId ? { ...t, avatar_url: path, avatar_key: null } : t,
        ),
      );
    },
    [selectedThreadId],
  );

  const handleStartBuzzer = useCallback(() => {
    if (!channelRef.current) return;
    const animalKey = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)].key;
    const round: BuzzerRound = {
      roundId: crypto.randomUUID(),
      animalKey,
      startedBy: profile.id,
      startedByName: profile.full_name,
    };
    channelRef.current.send({ type: "broadcast", event: "start_round", payload: round });
  }, [profile.id, profile.full_name]);

  const handleBuzz = useCallback(() => {
    if (!channelRef.current || !buzzerRound || hasBuzzed) return;
    setHasBuzzed(true);
    const winner: BuzzerWinner = {
      roundId: buzzerRound.roundId,
      userId: profile.id,
      userName: profile.full_name,
      animalKey: buzzerRound.animalKey,
    };
    channelRef.current.send({ type: "broadcast", event: "buzz", payload: winner });
  }, [buzzerRound, hasBuzzed, profile.id, profile.full_name]);

  const handleCloseBuzzer = useCallback(() => {
    setBuzzerRound(null);
    setBuzzerWinner(null);
    setHasBuzzed(false);
  }, []);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      {shower && (
        <EmojiShower
          key={shower.key}
          content={shower.content}
          seed={shower.key}
          onDone={() => setShower(null)}
        />
      )}
      {buzzerRound && (
        <BuzzerOverlay
          round={buzzerRound}
          winner={buzzerWinner}
          currentUserId={profile.id}
          hasBuzzed={hasBuzzed}
          onBuzz={handleBuzz}
          onClose={handleCloseBuzzer}
        />
      )}
      <div className={cn("w-full shrink-0 md:block md:w-72", selectedThreadId ? "hidden md:block" : "block")}>
        <Sidebar
          currentUser={profile}
          threads={threads}
          selectedThreadId={selectedThreadId}
          onSelectThread={setSelectedThreadId}
          onlineIds={onlineIds}
          members={allProfiles}
          onCreateThread={handleCreateThread}
          onSetAvatarKey={handleSetAvatarKey}
          onSetAvatarPhoto={handleSetAvatarPhoto}
          onChangePassword={handleChangePassword}
        />
      </div>
      <div className={cn("min-w-0 flex-1", selectedThreadId ? "block" : "hidden md:block")}>
        {selectedThread ? (
          <ChatWindow
            key={selectedThread.id}
            thread={selectedThread}
            messages={messages}
            currentUser={profile}
            onSend={handleSend}
            onSendAttachment={handleSendAttachment}
            onMarkRead={handleMarkRead}
            onReact={handleReact}
            onBack={() => setSelectedThreadId(null)}
            onSetTheme={handleSetTheme}
            onSetBackgroundPhoto={handleSetBackgroundPhoto}
            onSetGroupAvatarKey={handleSetGroupAvatarKey}
            onSetGroupAvatarPhoto={handleSetGroupAvatarPhoto}
            onStartBuzzer={handleStartBuzzer}
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
