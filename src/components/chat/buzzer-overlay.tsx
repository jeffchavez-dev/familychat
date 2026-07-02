"use client";

import { useEffect } from "react";
import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { cn } from "@/lib/utils";

export type BuzzerRound = {
  roundId: string;
  animalKey: string;
  startedBy: string;
  startedByName: string;
};

export type BuzzerWinner = {
  roundId: string;
  userId: string;
  userName: string;
  animalKey: string;
};

export function BuzzerOverlay({
  round,
  winner,
  currentUserId,
  hasBuzzed,
  onBuzz,
  onClose,
}: {
  round: BuzzerRound;
  winner: BuzzerWinner | null;
  currentUserId: string;
  hasBuzzed: boolean;
  onBuzz: () => void;
  onClose: () => void;
}) {
  const animal = AVATAR_PALETTE.find((p) => p.key === round.animalKey) ?? AVATAR_PALETTE[0];
  const isWinner = winner?.userId === currentUserId;

  useEffect(() => {
    if (!winner) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [winner, onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 bg-background/85 p-4 backdrop-blur-sm">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-card p-2.5 text-lg shadow-md"
        aria-label="Close buzzer game"
      >
        ✕
      </button>

      {!winner ? (
        <>
          <p className="text-center font-heading text-xl text-foreground">
            {round.startedByName} started a buzzer round!
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
      ) : (
        <>
          <span className="text-8xl">{animal.emoji}</span>
          <p className="text-center font-heading text-3xl text-primary">
            {isWinner ? "You win! 🎉" : `${winner.userName} wins! 🎉`}
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
    </div>
  );
}
