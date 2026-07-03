export const PAIR_COUNT_OPTIONS = [10, 15, 20];
export const DEFAULT_PAIR_COUNT = 10;

export const MEMORY_ANIMALS = [
  { key: "cat", emoji: "🐱" },
  { key: "dog", emoji: "🐶" },
  { key: "mouse", emoji: "🐭" },
  { key: "hamster", emoji: "🐹" },
  { key: "rabbit", emoji: "🐰" },
  { key: "fox", emoji: "🦊" },
  { key: "bear", emoji: "🐻" },
  { key: "panda", emoji: "🐼" },
  { key: "koala", emoji: "🐨" },
  { key: "tiger", emoji: "🐯" },
  { key: "lion", emoji: "🦁" },
  { key: "cow", emoji: "🐮" },
  { key: "pig", emoji: "🐷" },
  { key: "frog", emoji: "🐸" },
  { key: "monkey", emoji: "🐵" },
  { key: "chicken", emoji: "🐔" },
  { key: "penguin", emoji: "🐧" },
  { key: "chick", emoji: "🐤" },
  { key: "duck", emoji: "🦆" },
  { key: "owl", emoji: "🦉" },
];

export type MemoryCard = { id: string; animalKey: string };

export type MemoryPlayer = {
  userId: string;
  name: string;
  avatarKey: string | null;
  avatarUrl: string | null;
};

export type MemoryScore = { name: string; pairs: number };

export type MemoryRoundState = {
  gameId: string;
  roundId: string;
  totalPairs: number;
  players: MemoryPlayer[];
  cards: MemoryCard[];
  matchedBy: (string | null)[];
  revealed: number[];
  pendingMatch: boolean | null;
  lastActorId: string | null;
  currentPlayerId: string;
  scores: Record<string, MemoryScore>;
  startedBy: string;
  startedByName: string;
};

export type MemoryRoundSeed = {
  gameId: string;
  roundId: string;
  totalPairs: number;
  players: MemoryPlayer[];
  startedBy: string;
  startedByName: string;
};

// Same hash + mulberry32 PRNG pair as uno-game.ts/buzzer-overlay.tsx, duplicated
// here since this module has no React/UI dependency and neither exports them.
function hashString(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }
  return hash;
}

function mulberry32(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function buildDeck(totalPairs: number): MemoryCard[] {
  const animals = MEMORY_ANIMALS.slice(0, totalPairs);
  const deck: MemoryCard[] = [];
  for (const animal of animals) {
    deck.push({ id: `${animal.key}-a`, animalKey: animal.key });
    deck.push({ id: `${animal.key}-b`, animalKey: animal.key });
  }
  return deck;
}

// Deterministic Fisher-Yates so every client deals an identical shuffled board
// from a shared seed (roundId) without transmitting the card layout.
export function shuffleDeck(deck: MemoryCard[], seed: string): MemoryCard[] {
  const shuffled = [...deck];
  const baseSeed = hashString(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const roll = mulberry32(baseSeed + i);
    const j = Math.floor(roll * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealRound(seed: MemoryRoundSeed): MemoryRoundState {
  const cards = shuffleDeck(buildDeck(seed.totalPairs), seed.roundId);
  const scores: Record<string, MemoryScore> = {};
  for (const player of seed.players) {
    scores[player.userId] = { name: player.name, pairs: 0 };
  }

  return {
    gameId: seed.gameId,
    roundId: seed.roundId,
    totalPairs: seed.totalPairs,
    players: seed.players,
    cards,
    matchedBy: new Array(cards.length).fill(null),
    revealed: [],
    pendingMatch: null,
    lastActorId: null,
    currentPlayerId: seed.players[0].userId,
    scores,
    startedBy: seed.startedBy,
    startedByName: seed.startedByName,
  };
}

export function isLegalFlip(state: MemoryRoundState, index: number): boolean {
  return (
    state.pendingMatch === null &&
    state.revealed.length < 2 &&
    !state.revealed.includes(index) &&
    state.matchedBy[index] === null
  );
}

export function applyFlip(state: MemoryRoundState, userId: string, index: number): MemoryRoundState {
  if (state.currentPlayerId !== userId || !isLegalFlip(state, index)) return state;

  const revealed = [...state.revealed, index];

  if (revealed.length < 2) {
    return { ...state, revealed, lastActorId: userId };
  }

  const [firstIndex, secondIndex] = revealed;
  const isMatch = state.cards[firstIndex].animalKey === state.cards[secondIndex].animalKey;

  if (isMatch) {
    const matchedBy = [...state.matchedBy];
    matchedBy[firstIndex] = userId;
    matchedBy[secondIndex] = userId;
    const scores = {
      ...state.scores,
      [userId]: { ...state.scores[userId], pairs: state.scores[userId].pairs + 1 },
    };
    return { ...state, revealed, matchedBy, scores, pendingMatch: true, lastActorId: userId };
  }

  const seats = state.players.map((p) => p.userId);
  const nextIndex = (seats.indexOf(userId) + 1) % seats.length;
  return {
    ...state,
    revealed,
    pendingMatch: false,
    lastActorId: userId,
    currentPlayerId: seats[nextIndex],
  };
}

export function resolveTurn(state: MemoryRoundState): MemoryRoundState {
  return { ...state, revealed: [], pendingMatch: null };
}

export function isGameOver(state: MemoryRoundState): boolean {
  return state.matchedBy.every((userId) => userId !== null);
}

export function getWinners(state: MemoryRoundState): MemoryPlayer[] {
  const topPairs = Math.max(...state.players.map((p) => state.scores[p.userId].pairs));
  return state.players.filter((p) => state.scores[p.userId].pairs === topPairs);
}
