export type ChatTheme = {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
};

export const CHAT_THEMES: ChatTheme[] = [
  {
    key: "sunset",
    label: "Sunset",
    emoji: "🌅",
    gradient: "linear-gradient(160deg, #FFD93D 0%, #FF9F45 45%, #FF6B6B 100%)",
  },
  {
    key: "ocean",
    label: "Ocean",
    emoji: "🌊",
    gradient: "linear-gradient(160deg, #A0F0ED 0%, #5AC8FA 50%, #4ECDC4 100%)",
  },
  {
    key: "bubblegum",
    label: "Bubblegum",
    emoji: "🍬",
    gradient: "linear-gradient(160deg, #FFD1E8 0%, #FF8FB1 50%, #A78BFA 100%)",
  },
  {
    key: "forest",
    label: "Forest",
    emoji: "🌲",
    gradient: "linear-gradient(160deg, #DFF5D8 0%, #6BCB77 55%, #2F9E44 100%)",
  },
  {
    key: "galaxy",
    label: "Galaxy",
    emoji: "🌌",
    gradient: "linear-gradient(160deg, #A78BFA 0%, #6D5BD0 50%, #2E1F5E 100%)",
  },
  {
    key: "rainbow",
    label: "Rainbow",
    emoji: "🌈",
    gradient:
      "linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCB77 50%, #5AC8FA 75%, #A78BFA 100%)",
  },
];

export function findChatTheme(key: string | null) {
  return CHAT_THEMES.find((t) => t.key === key);
}
