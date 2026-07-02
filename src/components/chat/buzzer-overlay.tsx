"use client";

import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { cn } from "@/lib/utils";

export const ROUND_COUNT_OPTIONS = [3, 5, 7];
export const DEFAULT_ROUND_COUNT = 5;

export type BuzzerRound = {
  gameId: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  animalKey: string;
  startedBy: string;
  startedByName: string;
};

export type BuzzerWinner = {
  gameId: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  userId: string;
  userName: string;
  animalKey: string;
};

export type BuzzerScore = { name: string; wins: number };

export function BuzzerSetup({
  onChoose,
  onClose,
}: {
  onChoose: (totalRounds: number) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-background/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Cancel buzzer game"
      >
        ✕
      </button>
      <p className="text-center font-heading text-2xl text-foreground">How many rounds?</p>
      <div className="flex gap-3">
        {ROUND_COUNT_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChoose(n)}
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold shadow-lg transition-transform hover:scale-105 active:scale-90",
              n === DEFAULT_ROUND_COUNT
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <p className="font-heading text-sm text-muted-foreground">🎮 tap a number to start!</p>
    </div>
  );
}

export function BuzzerOverlay({
  round,
  winner,
  scores,
  currentUserId,
  hasBuzzed,
  onBuzz,
  onClose,
}: {
  round: BuzzerRound;
  winner: BuzzerWinner | null;
  scores: Record<string, BuzzerScore>;
  currentUserId: string;
  hasBuzzed: boolean;
  onBuzz: () => void;
  onClose: () => void;
}) {
  const animal = AVATAR_PALETTE.find((p) => p.key === round.animalKey) ?? AVATAR_PALETTE[0];
  const isWinner = winner?.userId === currentUserId;
  const isGameOver = !!winner && round.roundNumber === round.totalRounds;

  const scoreEntries = Object.entries(scores).sort((a, b) => b[1].wins - a[1].wins);
  const topWins = scoreEntries[0]?.[1].wins ?? 0;
  const topPlayers = scoreEntries.filter(([, s]) => s.wins === topWins).map(([, s]) => s.name);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-background/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Close buzzer game"
      >
        ✕
      </button>

      {!winner && (
        <>
          <p className="text-center font-heading text-xl text-foreground">
            Round {round.roundNumber} of {round.totalRounds}
          </p>
          <button
            type="button"
            onClick={onBuzz}
            disabled={hasBuzzed}
            className={cn(
              "flex h-40 w-40 items-center justify-center rounded-full text-7xl shadow-2xl transition-transform active:scale-90",
              hasBuzzed ? "opacity-60" : "animate-pulse hover:scale-105",
            )}
            style={{ backgroundColor: animal.bg }}
          >
            {animal.emoji}
          </button>
          <p className="font-heading text-lg text-muted-foreground">
            {hasBuzzed ? "You buzzed! Waiting for everyone..." : "Tap the animal first! 🏁"}
          </p>
        </>
      )}

      {winner && !isGameOver && (
        <>
          <span className="animate-bounce text-8xl">{animal.emoji}</span>
          <p className="text-center font-heading text-2xl text-primary">
            {isWinner ? "You win this round! 🎉" : `${winner.userName} wins this round! 🎉`}
          </p>
          <p className="font-heading text-sm text-muted-foreground">Next round coming up...</p>
        </>
      )}

      {isGameOver && (
        <>
          <span className="text-8xl">🏆</span>
          <p className="text-center font-heading text-3xl text-primary">
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
        </>
      )}

      {scoreEntries.length > 0 && (
        <div className="mt-2 flex flex-wrap justify-center gap-2">
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
