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

// Pure hash + mulberry32 PRNG so the button's position is derived straight
// from roundId during render (no Math.random(), which React's purity rule
// rejects in render) — every device lands on the same spot for a given
// round since roundId is shared over broadcast, without needing to sync a
// separate position value.
function hashString(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }
  return hash;
}

function seededRandom(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Percentage bounds keep the button (plus its translate(-50%, -50%) anchor)
// clear of the header text up top, the score pills at the bottom, and the
// screen edges on narrow phones — tuned for the button's own responsive size.
function buzzerPosition(roundId: string) {
  const seed = hashString(roundId);
  const top = 30 + seededRandom(seed) * 34; // 30%–64%
  const left = 20 + seededRandom(seed + 1) * 60; // 20%–80%
  return { top: `${top}%`, left: `${left}%` };
}

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
  const position = buzzerPosition(round.roundId);

  const scoreEntries = Object.entries(scores).sort((a, b) => b[1].wins - a[1].wins);
  const topWins = scoreEntries[0]?.[1].wins ?? 0;
  const topPlayers = scoreEntries.filter(([, s]) => s.wins === topWins).map(([, s]) => s.name);

  return (
    <div className="fixed inset-0 z-[80] bg-background/85 backdrop-blur-sm">
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
          <div className="absolute inset-x-0 top-10 flex flex-col items-center gap-1 px-4 text-center">
            <p className="font-heading text-xl text-foreground">
              Round {round.roundNumber} of {round.totalRounds}
            </p>
            <p className="font-heading text-base text-muted-foreground">
              {hasBuzzed ? "You buzzed! Waiting for everyone..." : "Find it and tap it first! 👀🏁"}
            </p>
          </div>
          <button
            key={round.roundId}
            type="button"
            onClick={onBuzz}
            disabled={hasBuzzed}
            className={cn(
              "animate-in zoom-in-50 fade-in absolute flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-6xl shadow-2xl duration-300 active:scale-90 sm:h-40 sm:w-40 sm:text-7xl",
              hasBuzzed ? "opacity-60" : "animate-pulse hover:scale-105",
            )}
            style={{ top: position.top, left: position.left, backgroundColor: animal.bg }}
          >
            {animal.emoji}
          </button>
        </>
      )}

      {winner && !isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
          <span className="animate-bounce text-8xl">{animal.emoji}</span>
          <p className="font-heading text-2xl text-primary">
            {isWinner ? "You win this round! 🎉" : `${winner.userName} wins this round! 🎉`}
          </p>
          <p className="font-heading text-sm text-muted-foreground">Next round coming up...</p>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center">
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

      {scoreEntries.length > 0 && (
        <div className="absolute inset-x-0 bottom-8 flex flex-wrap justify-center gap-2 px-4">
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
