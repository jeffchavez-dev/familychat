const PALETTE = [
  { bg: "#FF6B6B", emoji: "🦊" },
  { bg: "#4ECDC4", emoji: "🐢" },
  { bg: "#FFD93D", emoji: "🐥" },
  { bg: "#A78BFA", emoji: "🦄" },
  { bg: "#FF9F45", emoji: "🐯" },
  { bg: "#6BCB77", emoji: "🐸" },
  { bg: "#FF8FB1", emoji: "🐰" },
  { bg: "#5AC8FA", emoji: "🐳" },
];

function hashId(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function avatarStyle(id: string) {
  return PALETTE[hashId(id) % PALETTE.length];
}
