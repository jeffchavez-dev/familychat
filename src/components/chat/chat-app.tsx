"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/lib/supabase/use-presence";
import { cn } from "@/lib/utils";
import {
  addThreadParticipants,
  createFamilyMember,
  createThread,
  fetchMessages,
  fetchThreads,
  markMessageRead,
  sendGameNote,
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
import { formatGameNote } from "@/lib/game-note";
import { Sidebar } from "@/components/chat/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";
import { EmojiShower } from "@/components/chat/emoji-shower";
import {
  BuzzerOverlay,
  BuzzerSetup,
  type BuzzerRound,
  type BuzzerScore,
  type BuzzerWinner,
} from "@/components/chat/buzzer-overlay";
import { UnoLobby, UnoOverlay } from "@/components/chat/uno-overlay";
import {
  applyDrawCard,
  applyPlayCard,
  dealRound,
  type CardColor,
  type UnoPlayer,
  type UnoRoundSeed,
  type UnoRoundState,
  type UnoScore,
  type UnoWinner,
} from "@/lib/uno-game";
import { MemoryLobby, MemoryOverlay } from "@/components/chat/memory-overlay";
import {
  applyFlip,
  dealRound as dealMemoryRound,
  getWinners as getMemoryWinners,
  isGameOver as isMemoryGameOver,
  resolveTurn,
  type MemoryPlayer,
  type MemoryRoundSeed,
  type MemoryRoundState,
} from "@/lib/memory-game";
import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { isEmojiOnly } from "@/lib/emoji";
import type { Message, Profile, Thread } from "@/lib/types";

// Kept short so the game keeps moving — long enough to see who won, short
// enough that a 5-round game doesn't feel like it's stalling between rounds.
const ROUND_TRANSITION_MS = 1800;

// Long enough to actually study a mismatched pair (the whole point of a
// memory game), short enough that the board doesn't feel stuck between turns.
const MEMORY_FLIP_BACK_MS = 1200;

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
  const [buzzerSetupOpen, setBuzzerSetupOpen] = useState(false);
  const [buzzerRound, setBuzzerRound] = useState<BuzzerRound | null>(null);
  const [buzzerWinner, setBuzzerWinner] = useState<BuzzerWinner | null>(null);
  const [buzzerScores, setBuzzerScores] = useState<Record<string, BuzzerScore>>({});
  const [hasBuzzed, setHasBuzzed] = useState(false);
  const [unoLobbyOpen, setUnoLobbyOpen] = useState(false);
  const [unoRound, setUnoRound] = useState<UnoRoundState | null>(null);
  const [unoWinner, setUnoWinner] = useState<UnoWinner | null>(null);
  const [unoScores, setUnoScores] = useState<Record<string, UnoScore>>({});
  const [memoryLobbyOpen, setMemoryLobbyOpen] = useState(false);
  const [memoryRound, setMemoryRound] = useState<MemoryRoundState | null>(null);
  const [memoryWinners, setMemoryWinners] = useState<MemoryPlayer[] | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const channelReadyRef = useRef(false);
  // Mirrors unoRound outside React state so broadcast handlers can read/write
  // the latest value synchronously. Needed because the win check derives from
  // applying a move to prior state (unlike buzzer's self-contained winner
  // payload) — doing that inside a setState updater would let React's
  // dev-mode double-invocation of updater functions double-fire the
  // setUnoScores/setShower side effects nested inside it.
  const unoRoundRef = useRef<UnoRoundState | null>(null);
  // Same reason as unoRoundRef: the resolve-turn step needs the latest board
  // inside a broadcast handler without a stale closure.
  const memoryRoundRef = useRef<MemoryRoundState | null>(null);
  // BuzzerWinner payloads don't carry startedBy/scores (unlike Uno/memory's
  // round state), so these mirror the plain buzzerRound/buzzerScores state
  // to avoid reading a stale snapshot inside the long-lived channel effect.
  const buzzerRoundRef = useRef<BuzzerRound | null>(null);
  const buzzerScoresRef = useRef<Record<string, BuzzerScore>>({});
  const onlineIds = usePresence(profile.id);

  // Reset any active game when switching threads. Adjusting state directly
  // during render (guarded by comparing against the last-seen thread) is
  // React's recommended pattern for this, instead of an effect.
  const [buzzerThreadId, setBuzzerThreadId] = useState(selectedThreadId);
  if (selectedThreadId !== buzzerThreadId) {
    setBuzzerThreadId(selectedThreadId);
    setBuzzerSetupOpen(false);
    setBuzzerRound(null);
    setBuzzerWinner(null);
    setBuzzerScores({});
    setHasBuzzed(false);
    setUnoLobbyOpen(false);
    setUnoRound(null);
    setUnoWinner(null);
    setUnoScores({});
    setMemoryLobbyOpen(false);
    setMemoryRound(null);
    setMemoryWinners(null);
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
        const round = payload.payload as BuzzerRound;
        buzzerRoundRef.current = round;
        setBuzzerRound(round);
        setBuzzerWinner(null);
        setBuzzerSetupOpen(false);
        setHasBuzzed(false);
        if (round.roundNumber === 1) {
          buzzerScoresRef.current = {};
          setBuzzerScores({});
        }
      })
      .on("broadcast", { event: "buzz" }, (payload) => {
        const winner = payload.payload as BuzzerWinner;
        setBuzzerWinner((prev) => (prev && prev.roundId === winner.roundId ? prev : winner));
        const mergedScores = {
          ...buzzerScoresRef.current,
          [winner.userId]: {
            name: winner.userName,
            wins: (buzzerScoresRef.current[winner.userId]?.wins ?? 0) + 1,
          },
        };
        buzzerScoresRef.current = mergedScores;
        setBuzzerScores(mergedScores);
        if (winner.roundNumber === winner.totalRounds) {
          setShower({ key: Date.now(), content: "🏆" });
          if (selectedThreadId && buzzerRoundRef.current?.startedBy === profile.id) {
            const participantNames = Object.values(mergedScores).map((s) => s.name);
            sendGameNote(selectedThreadId, profile.id, formatGameNote(participantNames, "Buzzer 🎮"));
          }
        }
      })
      .on("broadcast", { event: "start_uno_lobby" }, () => {
        setUnoLobbyOpen(true);
      })
      .on("broadcast", { event: "start_uno_round" }, (payload) => {
        const seed = payload.payload as UnoRoundSeed;
        const dealt = dealRound(seed);
        unoRoundRef.current = dealt;
        setUnoRound(dealt);
        setUnoWinner(null);
        setUnoLobbyOpen(false);
        if (seed.roundNumber === 1) setUnoScores({});
      })
      .on("broadcast", { event: "play_uno_card" }, (payload) => {
        const move = payload.payload as {
          gameId: string;
          roundId: string;
          userId: string;
          cardId: string;
          chosenColor?: CardColor;
        };
        const prev = unoRoundRef.current;
        if (!prev || prev.roundId !== move.roundId) return;
        const next = applyPlayCard(prev, move.userId, move.cardId, move.chosenColor);
        unoRoundRef.current = next;
        setUnoRound(next);
        if (next.hands[move.userId].length === 0) {
          const winnerName = next.players.find((p) => p.userId === move.userId)?.name ?? "";
          const roundWinner: UnoWinner = {
            gameId: next.gameId,
            roundId: next.roundId,
            roundNumber: next.roundNumber,
            totalRounds: next.totalRounds,
            userId: move.userId,
            userName: winnerName,
          };
          setUnoWinner(roundWinner);
          setUnoScores((prevScores) => ({
            ...prevScores,
            [roundWinner.userId]: {
              name: roundWinner.userName,
              wins: (prevScores[roundWinner.userId]?.wins ?? 0) + 1,
            },
          }));
          if (roundWinner.roundNumber === roundWinner.totalRounds) {
            setShower({ key: Date.now(), content: "🏆" });
            if (selectedThreadId && next.startedBy === profile.id) {
              const participantNames = next.players.map((p) => p.name);
              sendGameNote(selectedThreadId, profile.id, formatGameNote(participantNames, "Uno 🃏"));
            }
          }
        }
      })
      .on("broadcast", { event: "draw_uno_card" }, (payload) => {
        const move = payload.payload as { gameId: string; roundId: string; userId: string };
        const prev = unoRoundRef.current;
        if (!prev || prev.roundId !== move.roundId) return;
        const next = applyDrawCard(prev, move.userId);
        unoRoundRef.current = next;
        setUnoRound(next);
      })
      .on("broadcast", { event: "start_memory_lobby" }, () => {
        setMemoryLobbyOpen(true);
      })
      .on("broadcast", { event: "start_memory_round" }, (payload) => {
        const seed = payload.payload as MemoryRoundSeed;
        const dealt = dealMemoryRound(seed);
        memoryRoundRef.current = dealt;
        setMemoryRound(dealt);
        setMemoryWinners(null);
        setMemoryLobbyOpen(false);
      })
      .on("broadcast", { event: "flip_memory_card" }, (payload) => {
        const move = payload.payload as {
          gameId: string;
          roundId: string;
          userId: string;
          cardIndex: number;
        };
        const prev = memoryRoundRef.current;
        if (!prev || prev.roundId !== move.roundId) return;
        const next = applyFlip(prev, move.userId, move.cardIndex);
        memoryRoundRef.current = next;
        setMemoryRound(next);
        if (isMemoryGameOver(next)) {
          setMemoryWinners(getMemoryWinners(next));
          setShower({ key: Date.now(), content: "🏆" });
          if (selectedThreadId && next.startedBy === profile.id) {
            const participantNames = next.players.map((p) => p.name);
            sendGameNote(selectedThreadId, profile.id, formatGameNote(participantNames, "Memory Match 🧠"));
          }
        }
      })
      .on("broadcast", { event: "resolve_memory_turn" }, (payload) => {
        const move = payload.payload as { gameId: string; roundId: string };
        const prev = memoryRoundRef.current;
        if (!prev || prev.roundId !== move.roundId) return;
        const next = resolveTurn(prev);
        memoryRoundRef.current = next;
        setMemoryRound(next);
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
      .subscribe((status) => {
        // Broadcasts sent before the channel finishes joining are silently
        // dropped rather than queued — Supabase's own docs gate .send()
        // calls on this callback for exactly this reason.
        channelReadyRef.current = status === "SUBSCRIBED";
      });

    channelRef.current = channel;

    return () => {
      channelReadyRef.current = false;
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
    // profile.id is the logged-in user's own id and doesn't change mid-session;
    // adding it here would just resubscribe the channel pointlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleAddFamilyMember = useCallback(async (name: string, password: string) => {
    await createFamilyMember(name, password);
  }, []);

  const handleAddParticipants = useCallback(
    async (userIds: string[]) => {
      if (!selectedThreadId) return;
      await addThreadParticipants(selectedThreadId, userIds);
      const updated = await fetchThreads();
      setThreads(updated);
    },
    [selectedThreadId],
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

  // Waits for the channel to actually finish joining before returning it —
  // broadcasts sent before that are silently dropped rather than queued.
  const waitForReadyChannel = useCallback(async () => {
    const channel = channelRef.current;
    if (!channel) return null;
    const deadline = Date.now() + 3000;
    while (!channelReadyRef.current && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return channelReadyRef.current ? channel : null;
  }, []);

  const handleStartBuzzer = useCallback(() => {
    setBuzzerSetupOpen(true);
  }, []);

  const handleChooseRounds = useCallback(
    async (totalRounds: number) => {
      const channel = await waitForReadyChannel();
      if (!channel) return;

      const animalKey = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)].key;
      const round: BuzzerRound = {
        gameId: crypto.randomUUID(),
        roundId: crypto.randomUUID(),
        roundNumber: 1,
        totalRounds,
        animalKey,
        startedBy: profile.id,
        startedByName: profile.full_name,
      };
      channel.send({ type: "broadcast", event: "start_round", payload: round });
    },
    [profile.id, profile.full_name, waitForReadyChannel],
  );

  const handleBuzz = useCallback(() => {
    if (!channelRef.current || !buzzerRound || hasBuzzed) return;
    setHasBuzzed(true);
    const winner: BuzzerWinner = {
      gameId: buzzerRound.gameId,
      roundId: buzzerRound.roundId,
      roundNumber: buzzerRound.roundNumber,
      totalRounds: buzzerRound.totalRounds,
      userId: profile.id,
      userName: profile.full_name,
      animalKey: buzzerRound.animalKey,
    };
    channelRef.current.send({ type: "broadcast", event: "buzz", payload: winner });
  }, [buzzerRound, hasBuzzed, profile.id, profile.full_name]);

  const handleCloseBuzzer = useCallback(() => {
    setBuzzerSetupOpen(false);
    setBuzzerRound(null);
    setBuzzerWinner(null);
    setBuzzerScores({});
    setHasBuzzed(false);
  }, []);

  const handleStartUno = useCallback(() => {
    setUnoLobbyOpen(true);
    waitForReadyChannel().then((channel) => {
      channel?.send({
        type: "broadcast",
        event: "start_uno_lobby",
        payload: { gameId: crypto.randomUUID(), openedBy: profile.id, openedByName: profile.full_name },
      });
    });
  }, [profile.id, profile.full_name, waitForReadyChannel]);

  const handleStartUnoGame = useCallback(
    async (selectedPlayerIds: string[], totalRounds: number) => {
      const channel = await waitForReadyChannel();
      if (!channel) return;

      const players: UnoPlayer[] = selectedPlayerIds
        .map((id) => allProfiles.find((p) => p.id === id))
        .filter((p): p is Profile => !!p)
        .map((p) => ({
          userId: p.id,
          name: p.full_name,
          avatarKey: p.avatar_key,
          avatarUrl: p.avatar_url,
        }));
      if (players.length < 2) return;

      const seed: UnoRoundSeed = {
        gameId: crypto.randomUUID(),
        roundId: crypto.randomUUID(),
        roundNumber: 1,
        totalRounds,
        players,
        startedBy: profile.id,
        startedByName: profile.full_name,
      };
      channel.send({ type: "broadcast", event: "start_uno_round", payload: seed });
    },
    [allProfiles, profile.id, profile.full_name, waitForReadyChannel],
  );

  const handlePlayUnoCard = useCallback(
    (cardId: string, chosenColor?: CardColor) => {
      if (!channelRef.current || !unoRound || unoRound.currentPlayerId !== profile.id) return;
      channelRef.current.send({
        type: "broadcast",
        event: "play_uno_card",
        payload: { gameId: unoRound.gameId, roundId: unoRound.roundId, userId: profile.id, cardId, chosenColor },
      });
    },
    [unoRound, profile.id],
  );

  const handleDrawUnoCard = useCallback(() => {
    if (!channelRef.current || !unoRound || unoRound.currentPlayerId !== profile.id) return;
    channelRef.current.send({
      type: "broadcast",
      event: "draw_uno_card",
      payload: { gameId: unoRound.gameId, roundId: unoRound.roundId, userId: profile.id },
    });
  }, [unoRound, profile.id]);

  const handleCloseUno = useCallback(() => {
    setUnoLobbyOpen(false);
    setUnoRound(null);
    unoRoundRef.current = null;
    setUnoWinner(null);
    setUnoScores({});
  }, []);

  const handleStartMemory = useCallback(() => {
    setMemoryLobbyOpen(true);
    waitForReadyChannel().then((channel) => {
      channel?.send({
        type: "broadcast",
        event: "start_memory_lobby",
        payload: { gameId: crypto.randomUUID(), openedBy: profile.id, openedByName: profile.full_name },
      });
    });
  }, [profile.id, profile.full_name, waitForReadyChannel]);

  const handleStartMemoryGame = useCallback(
    async (selectedPlayerIds: string[], totalPairs: number) => {
      const channel = await waitForReadyChannel();
      if (!channel) return;

      const players: MemoryPlayer[] = selectedPlayerIds
        .map((id) => allProfiles.find((p) => p.id === id))
        .filter((p): p is Profile => !!p)
        .map((p) => ({
          userId: p.id,
          name: p.full_name,
          avatarKey: p.avatar_key,
          avatarUrl: p.avatar_url,
        }));
      if (players.length < 2) return;

      const seed: MemoryRoundSeed = {
        gameId: crypto.randomUUID(),
        roundId: crypto.randomUUID(),
        totalPairs,
        players,
        startedBy: profile.id,
        startedByName: profile.full_name,
      };
      channel.send({ type: "broadcast", event: "start_memory_round", payload: seed });
    },
    [allProfiles, profile.id, profile.full_name, waitForReadyChannel],
  );

  const handleFlipMemoryCard = useCallback(
    (cardIndex: number) => {
      if (!channelRef.current || !memoryRound || memoryRound.currentPlayerId !== profile.id) return;
      channelRef.current.send({
        type: "broadcast",
        event: "flip_memory_card",
        payload: {
          gameId: memoryRound.gameId,
          roundId: memoryRound.roundId,
          userId: profile.id,
          cardIndex,
        },
      });
    },
    [memoryRound, profile.id],
  );

  const handleCloseMemory = useCallback(() => {
    setMemoryLobbyOpen(false);
    setMemoryRound(null);
    memoryRoundRef.current = null;
    setMemoryWinners(null);
  }, []);

  // Once a round has a winner, the player who started the game (and only
  // that player, so every device doesn't race to broadcast the same round)
  // advances to the next round after a short pause.
  useEffect(() => {
    if (!buzzerWinner || !buzzerRound) return;
    if (buzzerRound.startedBy !== profile.id) return;
    if (buzzerRound.roundNumber >= buzzerRound.totalRounds) return;

    const timer = setTimeout(() => {
      const channel = channelRef.current;
      if (!channel || !channelReadyRef.current) return;
      const animalKey = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)].key;
      const nextRound: BuzzerRound = {
        gameId: buzzerRound.gameId,
        roundId: crypto.randomUUID(),
        roundNumber: buzzerRound.roundNumber + 1,
        totalRounds: buzzerRound.totalRounds,
        animalKey,
        startedBy: buzzerRound.startedBy,
        startedByName: buzzerRound.startedByName,
      };
      channel.send({ type: "broadcast", event: "start_round", payload: nextRound });
    }, ROUND_TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [buzzerWinner, buzzerRound, profile.id]);

  // Same pattern as the buzzer's round auto-advance: only the player who
  // started the game broadcasts the next round, so devices don't race.
  useEffect(() => {
    if (!unoWinner || !unoRound) return;
    if (unoRound.startedBy !== profile.id) return;
    if (unoRound.roundNumber >= unoRound.totalRounds) return;

    const timer = setTimeout(() => {
      const channel = channelRef.current;
      if (!channel || !channelReadyRef.current) return;
      const nextSeed: UnoRoundSeed = {
        gameId: unoRound.gameId,
        roundId: crypto.randomUUID(),
        roundNumber: unoRound.roundNumber + 1,
        totalRounds: unoRound.totalRounds,
        players: unoRound.players,
        startedBy: unoRound.startedBy,
        startedByName: unoRound.startedByName,
      };
      channel.send({ type: "broadcast", event: "start_uno_round", payload: nextSeed });
    }, ROUND_TRANSITION_MS);

    return () => clearTimeout(timer);
  }, [unoWinner, unoRound, profile.id]);

  // Once a flip resolves to a match or mismatch, only the player who caused
  // it (lastActorId) broadcasts the clear-and-advance step, so devices don't
  // race to send the same resolution.
  useEffect(() => {
    if (!memoryRound || memoryRound.pendingMatch === null) return;
    if (memoryRound.lastActorId !== profile.id) return;

    const timer = setTimeout(() => {
      const channel = channelRef.current;
      if (!channel || !channelReadyRef.current || !memoryRound) return;
      channel.send({
        type: "broadcast",
        event: "resolve_memory_turn",
        payload: { gameId: memoryRound.gameId, roundId: memoryRound.roundId },
      });
    }, MEMORY_FLIP_BACK_MS);

    return () => clearTimeout(timer);
  }, [memoryRound, profile.id]);

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
      {buzzerSetupOpen && (
        <BuzzerSetup onChoose={handleChooseRounds} onClose={handleCloseBuzzer} />
      )}
      {buzzerRound && (
        <BuzzerOverlay
          round={buzzerRound}
          winner={buzzerWinner}
          scores={buzzerScores}
          currentUserId={profile.id}
          hasBuzzed={hasBuzzed}
          onBuzz={handleBuzz}
          onClose={handleCloseBuzzer}
        />
      )}
      {unoLobbyOpen && (
        <UnoLobby
          threadParticipants={selectedThread?.participants ?? []}
          onlineIds={onlineIds}
          currentUserId={profile.id}
          onStartGame={handleStartUnoGame}
          onClose={handleCloseUno}
        />
      )}
      {unoRound && (
        <UnoOverlay
          round={unoRound}
          winner={unoWinner}
          scores={unoScores}
          currentUserId={profile.id}
          onPlayCard={handlePlayUnoCard}
          onDrawCard={handleDrawUnoCard}
          onClose={handleCloseUno}
        />
      )}
      {memoryLobbyOpen && (
        <MemoryLobby
          threadParticipants={selectedThread?.participants ?? []}
          onlineIds={onlineIds}
          currentUserId={profile.id}
          onStartGame={handleStartMemoryGame}
          onClose={handleCloseMemory}
        />
      )}
      {memoryRound && (
        <MemoryOverlay
          round={memoryRound}
          winners={memoryWinners}
          currentUserId={profile.id}
          onFlipCard={handleFlipMemoryCard}
          onClose={handleCloseMemory}
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
          onAddFamilyMember={handleAddFamilyMember}
        />
      </div>
      <div className={cn("min-w-0 flex-1", selectedThreadId ? "block" : "hidden md:block")}>
        {selectedThread ? (
          <ChatWindow
            key={selectedThread.id}
            thread={selectedThread}
            messages={messages}
            currentUser={profile}
            allProfiles={allProfiles}
            onSend={handleSend}
            onSendAttachment={handleSendAttachment}
            onMarkRead={handleMarkRead}
            onReact={handleReact}
            onBack={() => setSelectedThreadId(null)}
            onSetTheme={handleSetTheme}
            onSetBackgroundPhoto={handleSetBackgroundPhoto}
            onSetGroupAvatarKey={handleSetGroupAvatarKey}
            onSetGroupAvatarPhoto={handleSetGroupAvatarPhoto}
            onAddParticipants={handleAddParticipants}
            onStartBuzzer={handleStartBuzzer}
            onStartUno={handleStartUno}
            onStartMemory={handleStartMemory}
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
