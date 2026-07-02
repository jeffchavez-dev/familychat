"use client";

import { useState } from "react";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ROUND_COUNT,
  ROUND_COUNT_OPTIONS,
  isLegalPlay,
  type Card,
  type CardColor,
  type UnoRoundState,
  type UnoScore,
  type UnoWinner,
} from "@/lib/uno-game";
import type { Profile } from "@/lib/types";

const CARD_COLOR_HEX: Record<CardColor, string> = {
  red: "#E85C5C",
  yellow: "#F2C94C",
  green: "#4CAF7D",
  blue: "#4A90D9",
  wild: "#3A3A4A",
};

const PLAYABLE_COLORS: Exclude<CardColor, "wild">[] = ["red", "yellow", "green", "blue"];

function cardLabel(card: Card): string {
  switch (card.kind.type) {
    case "number":
      return String(card.kind.value);
    case "skip":
      return "⛔";
    case "reverse":
      return "🔁";
    case "draw_two":
      return "+2";
    case "wild":
      return "🌈";
  }
}

const KIND_ORDER: Record<Card["kind"]["type"], number> = {
  number: 0,
  skip: 1,
  reverse: 2,
  draw_two: 3,
  wild: 4,
};
const COLOR_ORDER: Record<CardColor, number> = { red: 0, yellow: 1, green: 2, blue: 3, wild: 4 };

function sortHand(hand: Card[]): Card[] {
  return [...hand].sort((a, b) => {
    if (a.color !== b.color) return COLOR_ORDER[a.color] - COLOR_ORDER[b.color];
    if (a.kind.type !== b.kind.type) return KIND_ORDER[a.kind.type] - KIND_ORDER[b.kind.type];
    if (a.kind.type === "number" && b.kind.type === "number") return a.kind.value - b.kind.value;
    return 0;
  });
}

function UnoCard({
  card,
  size = "md",
  disabled,
  onClick,
}: {
  card: Card;
  size?: "sm" | "md";
  disabled?: boolean;
  onClick?: () => void;
}) {
  const sizeClass = size === "sm" ? "h-14 w-10 text-lg" : "h-20 w-14 text-2xl";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick || disabled}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl border-2 border-white/70 font-bold text-white shadow-md transition-transform",
        sizeClass,
        onClick && !disabled ? "hover:-translate-y-1 active:scale-95" : "opacity-40",
      )}
      style={{ backgroundColor: CARD_COLOR_HEX[card.color] }}
    >
      {cardLabel(card)}
    </button>
  );
}

export function UnoLobby({
  threadParticipants,
  onlineIds,
  currentUserId,
  onStartGame,
  onClose,
}: {
  threadParticipants: Profile[];
  onlineIds: Set<string>;
  currentUserId: string;
  onStartGame: (selectedPlayerIds: string[], totalRounds: number) => void;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([currentUserId]);
  const [totalRounds, setTotalRounds] = useState(DEFAULT_ROUND_COUNT);

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-background/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Cancel Uno game"
      >
        ✕
      </button>

      <p className="text-center font-heading text-2xl text-foreground">Who&apos;s playing? 🃏</p>
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

      <p className="font-heading text-sm text-muted-foreground">How many rounds?</p>
      <div className="flex gap-3">
        {ROUND_COUNT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setTotalRounds(n)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold shadow-lg transition-transform active:scale-90",
              n === totalRounds ? "bg-primary text-primary-foreground" : "bg-card text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={selectedIds.length < 2}
        onClick={() => onStartGame(selectedIds, totalRounds)}
        className={cn(
          "rounded-full px-8 py-3 font-heading text-lg shadow-lg transition-transform active:scale-95",
          selectedIds.length < 2
            ? "bg-card text-muted-foreground opacity-50"
            : "bg-primary text-primary-foreground",
        )}
      >
        Deal &apos;em! 🎴
      </button>
    </div>
  );
}

export function UnoOverlay({
  round,
  winner,
  scores,
  currentUserId,
  onPlayCard,
  onDrawCard,
  onClose,
}: {
  round: UnoRoundState;
  winner: UnoWinner | null;
  scores: Record<string, UnoScore>;
  currentUserId: string;
  onPlayCard: (cardId: string, chosenColor?: CardColor) => void;
  onDrawCard: () => void;
  onClose: () => void;
}) {
  const [pendingWildCardId, setPendingWildCardId] = useState<string | null>(null);

  // Clear the wild-color prompt when a new round starts. Adjusting state
  // directly during render (guarded by comparing against the last-seen
  // round) is React's recommended pattern for this, instead of an effect.
  const [pendingWildRoundId, setPendingWildRoundId] = useState(round.roundId);
  if (round.roundId !== pendingWildRoundId) {
    setPendingWildRoundId(round.roundId);
    setPendingWildCardId(null);
  }

  const isPlayer = round.players.some((p) => p.userId === currentUserId);
  const isMyTurn = round.currentPlayerId === currentUserId;
  const myHand = sortHand(round.hands[currentUserId] ?? []);
  const discardTop = round.discardPile[round.discardPile.length - 1];
  const currentPlayerName = round.players.find((p) => p.userId === round.currentPlayerId)?.name ?? "";
  const isGameOver = !!winner && round.roundNumber === round.totalRounds;

  const scoreEntries = Object.entries(scores).sort((a, b) => b[1].wins - a[1].wins);
  const topWins = scoreEntries[0]?.[1].wins ?? 0;
  const topPlayers = scoreEntries.filter(([, s]) => s.wins === topWins).map(([, s]) => s.name);

  const handleTapCard = (card: Card) => {
    if (!isMyTurn || !isLegalPlay(round, card)) return;
    if (card.color === "wild") {
      setPendingWildCardId(card.id);
      return;
    }
    onPlayCard(card.id);
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-background/95 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Close Uno game"
      >
        ✕
      </button>

      {!winner && (
        <>
          <div className="flex flex-col items-center gap-1 px-4 pt-8 text-center">
            <p className="font-heading text-lg text-foreground">
              Round {round.roundNumber} of {round.totalRounds}
            </p>
            <p className="font-heading text-base text-muted-foreground">
              {isMyTurn ? "Your turn! 🎉" : `Waiting for ${currentPlayerName}...`}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 px-4 py-3">
            {round.players.map((p) => {
              const count = round.hands[p.userId]?.length ?? 0;
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
                    {count === 1 ? "1 card left! 🔥" : `${count} cards`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex flex-1 items-center justify-center gap-6 px-4">
            <button
              type="button"
              onClick={isMyTurn && isPlayer ? onDrawCard : undefined}
              disabled={!isMyTurn || !isPlayer}
              className={cn(
                "flex h-20 w-14 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-foreground/30 font-heading text-xs text-foreground shadow-md",
                isMyTurn && isPlayer ? "active:scale-95" : "opacity-50",
              )}
            >
              Draw
              <br />
              {round.drawPile.length}
            </button>
            {discardTop && <UnoCard card={discardTop} />}
          </div>

          {isPlayer ? (
            <div className="flex flex-wrap justify-center gap-2 border-t bg-card/60 p-4">
              {myHand.map((card) => (
                <UnoCard
                  key={card.id}
                  card={card}
                  onClick={isMyTurn ? () => handleTapCard(card) : undefined}
                  disabled={!isMyTurn || !isLegalPlay(round, card)}
                />
              ))}
            </div>
          ) : (
            <div className="border-t bg-card/60 p-4 text-center font-heading text-sm text-muted-foreground">
              You&apos;re watching this game 👀
            </div>
          )}

          {pendingWildCardId && (
            <div className="fixed inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-background/90 p-4">
              <p className="font-heading text-xl text-foreground">Pick a color!</p>
              <div className="flex gap-3">
                {PLAYABLE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      onPlayCard(pendingWildCardId, color);
                      setPendingWildCardId(null);
                    }}
                    className="h-16 w-16 rounded-full border-4 border-white shadow-lg active:scale-90"
                    style={{ backgroundColor: CARD_COLOR_HEX[color] }}
                    aria-label={`Choose ${color}`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {winner && !isGameOver && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="animate-bounce text-8xl">🃏</span>
          <p className="font-heading text-2xl text-primary">
            {winner.userId === currentUserId ? "You win this round! 🎉" : `${winner.userName} wins this round! 🎉`}
          </p>
          <p className="font-heading text-sm text-muted-foreground">Next round coming up...</p>
        </div>
      )}

      {isGameOver && (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="text-8xl">🏆</span>
          <p className="font-heading text-3xl text-primary">
            {topPlayers.length > 1
              ? `It's a tie between ${topPlayers.join(" & ")}!`
              : `${topPlayers[0]} wins the game! 🎉`}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-primary px-6 py-2 font-bold text-primary-foreground shadow-md"
          >
            Nice! 🙌
          </button>
        </div>
      )}

      {scoreEntries.length > 0 && !winner && (
        <div className="flex flex-wrap justify-center gap-2 px-4 pb-2">
          {scoreEntries.map(([userId, s]) => (
            <span
              key={userId}
              className="rounded-full bg-card/85 px-3 py-1 text-sm font-bold text-foreground shadow-sm"
            >
              {s.name}: {s.wins}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
