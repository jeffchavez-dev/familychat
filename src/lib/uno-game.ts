export type CardColor = "red" | "yellow" | "green" | "blue" | "wild";
export type CardKind =
  | { type: "number"; value: number }
  | { type: "skip" }
  | { type: "reverse" }
  | { type: "draw_two" }
  | { type: "wild" };

export type Card = { id: string; color: CardColor; kind: CardKind };

export const ROUND_COUNT_OPTIONS = [3, 5, 7];
export const DEFAULT_ROUND_COUNT = 5;

const PLAY_COLORS: Exclude<CardColor, "wild">[] = ["red", "yellow", "green", "blue"];

export type UnoPlayer = {
  userId: string;
  name: string;
  avatarKey: string | null;
  avatarUrl: string | null;
};
export type UnoScore = { name: string; wins: number };

export type UnoRoundState = {
  gameId: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  players: UnoPlayer[];
  hands: Record<string, Card[]>;
  drawPile: Card[];
  discardPile: Card[];
  currentColor: CardColor;
  currentPlayerId: string;
  direction: 1 | -1;
  reshuffleCount: number;
  startedBy: string;
  startedByName: string;
};

export type UnoWinner = {
  gameId: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  userId: string;
  userName: string;
};

export type UnoRoundSeed = {
  gameId: string;
  roundId: string;
  roundNumber: number;
  totalRounds: number;
  players: UnoPlayer[];
  startedBy: string;
  startedByName: string;
};

// Same hash + mulberry32 PRNG pair as buzzer-overlay.tsx's hashString/seededRandom,
// duplicated here (rather than imported) since this module has no React/UI
// dependency and buzzer doesn't export them for reuse.
export function hashString(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  }
  return hash;
}

export function mulberry32(seed: number) {
  let t = (seed + 0x6d2b79f5) | 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of PLAY_COLORS) {
    deck.push({ id: `${color}-0`, color, kind: { type: "number", value: 0 } });
    for (let value = 1; value <= 9; value++) {
      deck.push({ id: `${color}-${value}-a`, color, kind: { type: "number", value } });
      deck.push({ id: `${color}-${value}-b`, color, kind: { type: "number", value } });
    }
    deck.push({ id: `${color}-skip-a`, color, kind: { type: "skip" } });
    deck.push({ id: `${color}-skip-b`, color, kind: { type: "skip" } });
    deck.push({ id: `${color}-reverse-a`, color, kind: { type: "reverse" } });
    deck.push({ id: `${color}-reverse-b`, color, kind: { type: "reverse" } });
    deck.push({ id: `${color}-draw_two-a`, color, kind: { type: "draw_two" } });
    deck.push({ id: `${color}-draw_two-b`, color, kind: { type: "draw_two" } });
  }
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `wild-${i}`, color: "wild", kind: { type: "wild" } });
  }
  return deck;
}

// Deterministic Fisher-Yates so every client reproduces the identical shuffled
// order from a shared seed (roundId) without transmitting the deck/hands.
export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const shuffled = [...deck];
  const baseSeed = hashString(seed);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const roll = mulberry32(baseSeed + i);
    const j = Math.floor(roll * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function dealRound(seed: UnoRoundSeed): UnoRoundState {
  const deck = shuffleDeck(buildDeck(), seed.roundId);
  const hands: Record<string, Card[]> = {};
  for (const player of seed.players) hands[player.userId] = [];

  let cursor = 0;
  for (let card = 0; card < 7; card++) {
    for (const player of seed.players) {
      hands[player.userId].push(deck[cursor]);
      cursor++;
    }
  }

  // Flip cards for the opening discard until a plain number card shows up —
  // sidesteps first-turn special-case rules for a flipped action/wild card.
  let discardTop: Card;
  do {
    discardTop = deck[cursor];
    cursor++;
  } while (discardTop.kind.type !== "number");

  return {
    gameId: seed.gameId,
    roundId: seed.roundId,
    roundNumber: seed.roundNumber,
    totalRounds: seed.totalRounds,
    players: seed.players,
    hands,
    drawPile: deck.slice(cursor),
    discardPile: [discardTop],
    currentColor: discardTop.color,
    currentPlayerId: seed.players[0].userId,
    direction: 1,
    reshuffleCount: 0,
    startedBy: seed.startedBy,
    startedByName: seed.startedByName,
  };
}

export function isLegalPlay(state: UnoRoundState, card: Card): boolean {
  if (card.color === "wild") return true;
  const top = state.discardPile[state.discardPile.length - 1];
  if (card.color === state.currentColor) return true;
  if (card.kind.type === "number" && top.kind.type === "number") {
    return card.kind.value === top.kind.value;
  }
  return card.kind.type === top.kind.type && card.kind.type !== "number";
}

export function nextPlayerId(state: UnoRoundState, from = state.currentPlayerId, steps = 1): string {
  const seats = state.players.map((p) => p.userId);
  const currentIndex = seats.indexOf(from);
  const nextIndex =
    (((currentIndex + steps * state.direction) % seats.length) + seats.length) % seats.length;
  return seats[nextIndex];
}

function reshuffleFromDiscard(state: UnoRoundState): UnoRoundState {
  if (state.drawPile.length > 0) return state;
  const top = state.discardPile[state.discardPile.length - 1];
  const rest = state.discardPile.slice(0, -1);
  const reshuffled = shuffleDeck(rest, `${state.roundId}-${state.reshuffleCount}`);
  return {
    ...state,
    drawPile: reshuffled,
    discardPile: [top],
    reshuffleCount: state.reshuffleCount + 1,
  };
}

export function applyPlayCard(
  state: UnoRoundState,
  userId: string,
  cardId: string,
  chosenColor?: CardColor,
): UnoRoundState {
  const hand = state.hands[userId];
  const card = hand.find((c) => c.id === cardId);
  if (!card) return state;

  const nextHands = { ...state.hands, [userId]: hand.filter((c) => c.id !== cardId) };
  const nextDiscard = [...state.discardPile, card];
  const resolvedColor = card.color === "wild" ? (chosenColor ?? PLAY_COLORS[0]) : card.color;

  let next: UnoRoundState = {
    ...state,
    hands: nextHands,
    discardPile: nextDiscard,
    currentColor: resolvedColor,
  };

  const playerCount = state.players.length;

  switch (card.kind.type) {
    case "skip": {
      next.currentPlayerId = nextPlayerId(next, userId, 2);
      break;
    }
    case "reverse": {
      // With exactly 2 players a reverse has no one else to hand the turn to,
      // so it acts as a skip (turn returns to the player who played it).
      next.direction = (next.direction * -1) as 1 | -1;
      next.currentPlayerId = nextPlayerId(next, userId, playerCount === 2 ? 2 : 1);
      break;
    }
    case "draw_two": {
      const targetId = nextPlayerId(next, userId, 1);
      let withDraw = next;
      for (let i = 0; i < 2; i++) {
        withDraw = reshuffleFromDiscard(withDraw);
        const [drawn, ...rest] = withDraw.drawPile;
        withDraw = {
          ...withDraw,
          drawPile: rest,
          hands: { ...withDraw.hands, [targetId]: [...withDraw.hands[targetId], drawn] },
        };
      }
      next = withDraw;
      next.currentPlayerId = nextPlayerId(next, userId, 2);
      break;
    }
    default: {
      next.currentPlayerId = nextPlayerId(next, userId, 1);
    }
  }

  return next;
}

export function applyDrawCard(state: UnoRoundState, userId: string): UnoRoundState {
  const withDraw = reshuffleFromDiscard(state);
  if (withDraw.drawPile.length === 0) return withDraw;
  const [drawn, ...rest] = withDraw.drawPile;
  return {
    ...withDraw,
    drawPile: rest,
    hands: { ...withDraw.hands, [userId]: [...withDraw.hands[userId], drawn] },
    currentPlayerId: nextPlayerId(withDraw, userId, 1),
  };
}
