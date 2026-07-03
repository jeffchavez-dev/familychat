"use client";

import { useState } from "react";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { cn } from "@/lib/utils";
import {
  DEFAULT_PAIR_COUNT,
  MEMORY_ANIMALS,
  PAIR_COUNT_OPTIONS,
  type MemoryPlayer,
  type MemoryRoundState,
} from "@/lib/memory-game";
import type { Profile } from "@/lib/types";

const ANIMAL_EMOJI: Record<string, string> = Object.fromEntries(
  MEMORY_ANIMALS.map((a) => [a.key, a.emoji]),
);

const GRID_COLS: Record<number, string> = {
  10: "grid-cols-5",
  15: "grid-cols-6",
  20: "grid-cols-8",
};

export function MemoryLobby({
  threadParticipants,
  onlineIds,
  currentUserId,
  onStartGame,
  onClose,
}: {
  threadParticipants: Profile[];
  onlineIds: Set<string>;
  currentUserId: string;
  onStartGame: (selectedPlayerIds: string[], totalPairs: number) => void;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUserId]);
  const [totalPairs, setTotalPairs] = useState(DEFAULT_PAIR_COUNT);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-background/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Cancel memory game"
      >
        ✕
      </button>

      <p className="text-center font-heading text-2xl text-foreground">Who&apos;s playing? 🧠</p>
      <div className="flex max-w-sm flex-wrap justify-center gap-2 px-4">
        {threadParticipants.map((p) => {
          const online = onlineIds.has(p.id);
          const selected = selectedIds.includes(p.id);
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-2 shadow-sm transition-transform active:scale-95",
                selected ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
                !online && !selected && "opacity-60",
              )}
            >
              <FunAvatar id={p.id} avatarKey={p.avatar_key} avatarUrl={p.avatar_url} size="sm" />
              <span className="font-heading text-sm">{p.full_name}</span>
              {!online && <span className="text-xs">💤</span>}
            </button>
          );
        })}
      </div>

      <p className="font-heading text-sm text-muted-foreground">How many pairs?</p>
      <div className="flex gap-3">
        {PAIR_COUNT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTotalPairs(n)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold shadow-lg transition-transform active:scale-90",
              n === totalPairs ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={selectedIds.length < 2}
        onClick={() => onStartGame(selectedIds, totalPairs)}
        className={cn(
          "rounded-full px-8 py-3 font-heading text-lg shadow-lg transition-transform active:scale-95",
          selectedIds.length < 2
            ? "bg-card text-muted-foreground opacity-50"
            : "bg-primary text-primary-foreground",
        )}
      >
        Shuffle &apos;em! 🎴
      </button>
    </div>
  );
}

export function MemoryOverlay({
  round,
  winners,
  currentUserId,
  onFlipCard,
  onClose,
}: {
  round: MemoryRoundState;
  winners: MemoryPlayer[] | null;
  currentUserId: string;
  onFlipCard: (index: number) => void;
  onClose: () => void;
}) {
  const isPlayer = round.players.some((p) => p.userId === currentUserId);
  const isMyTurn = round.currentPlayerId === currentUserId;
  const currentPlayerName = round.players.find((p) => p.userId === round.currentPlayerId)?.name ?? "";
  const gridColsClass = GRID_COLS[round.totalPairs] ?? "grid-cols-5";

  const canFlip = isMyTurn && isPlayer && round.pendingMatch === null;

  if (winners) {
    return (
      <div className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-sm">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="text-8xl">🏆</span>
          <p className="font-heading text-3xl text-primary">
            {winners.length > 1
              ? `It's a tie between ${winners.map((w) => w.name).join(" & ")}!`
              : `${winners[0].name} wins the game! 🎉`}
          </p>
          <div className="flex flex-wrap justify-center gap-2 px-4">
            {round.players.map((p) => (
              <span
                key={p.userId}
                className="rounded-full bg-card/85 px-3 py-1 text-sm font-bold text-foreground shadow-sm"
              >
                {p.name}: {round.scores[p.userId]?.pairs ?? 0}
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground shadow-md"
          >
            Nice! 🙌
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Close memory game"
      >
        ✕
      </button>

      <div className="flex flex-col items-center gap-1 px-4 pt-8 text-center">
        <p className="font-heading text-lg text-foreground">Find the pairs! 🧠</p>
        <p className="font-heading text-base text-muted-foreground">
          {isMyTurn ? "Your turn! 🎉" : `Waiting for ${currentPlayerName}...`}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3">
        {round.players.map((p) => {
          const isTurn = p.userId === round.currentPlayerId;
          return (
            <div
              key={p.userId}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl px-2 py-1",
                isTurn && "bg-primary/15",
              )}
            >
              <FunAvatar id={p.userId} avatarKey={p.avatarKey} avatarUrl={p.avatarUrl} size="sm" />
              <span className="font-heading text-xs text-foreground">{p.name}</span>
              <span className="rounded-full bg-card px-2 py-0.5 text-xs font-bold shadow-sm">
                {round.scores[p.userId]?.pairs ?? 0} pairs
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-1 items-start justify-center overflow-y-auto p-4">
        <div className={cn("grid w-full max-w-lg gap-2", gridColsClass)}>
          {round.cards.map((card, index) => {
            const isMatched = round.matchedBy[index] !== null;
            const isRevealed = isMatched || round.revealed.includes(index);
            const disabled = !canFlip || isMatched || round.revealed.includes(index);
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => onFlipCard(index)}
                disabled={disabled}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl text-2xl shadow-md transition-transform sm:text-3xl",
                  isRevealed ? "bg-card" : "bg-primary text-primary-foreground",
                  isMatched && "opacity-40",
                  !disabled && "hover:-translate-y-0.5 active:scale-95",
                )}
              >
                {isRevealed ? ANIMAL_EMOJI[card.animalKey] : "🎴"}
              </button>
            );
          })}
        </div>
      </div>

      {!isPlayer && (
        <div className="border-t bg-card/60 p-4 text-center font-heading text-sm text-muted-foreground">
          You&apos;re watching this game 👀
        </div>
      )}
    </div>
  );
}
