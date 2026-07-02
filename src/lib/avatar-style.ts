export const AVATAR_PALETTE = [
  { key: "fox", bg: "#FF6B6B", emoji: "🦊" },
  { key: "turtle", bg: "#4ECDC4", emoji: "🐢" },
  { key: "chick", bg: "#FFD93D", emoji: "🐥" },
  { key: "unicorn", bg: "#A78BFA", emoji: "🦄" },
  { key: "tiger", bg: "#FF9F45", emoji: "🐯" },
  { key: "frog", bg: "#6BCB77", emoji: "🐸" },
  { key: "bunny", bg: "#FF8FB1", emoji: "🐰" },
  { key: "whale", bg: "#5AC8FA", emoji: "🐳" },
];

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function avatarStyle(id: string, avatarKey?: string | null) {
  if (avatarKey) {
    const chosen = AVATAR_PALETTE.find((p) => p.key === avatarKey);
    if (chosen) return chosen;
  }
  return AVATAR_PALETTE[hashId(id) % AVATAR_PALETTE.length];
}
