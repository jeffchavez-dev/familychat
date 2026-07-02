import {
  balloon,
  cloud,
  dot,
  fish,
  flower,
  heart,
  moon,
  mushroom,
  planet,
  sparkle,
  star,
  sun,
  toDataUri,
  tree,
  wave,
} from "@/lib/chat-theme-svg";

export type ChatTheme = {
  key: string;
  label: string;
  emoji: string;
  gradient: string;
  pattern: string;
  patternSize: number;
};

const TILE = 360;

const SUNSET_SVG = [
  sun(300, 60, 26, "#FFE27A", 0.9),
  cloud(70, 70, 0.85, "#FFFFFF", 0.55),
  cloud(220, 140, 0.6, "#FFFFFF", 0.4),
  balloon(50, 250, 1, "#FF6B6B", 0.85),
  balloon(90, 220, 0.7, "#FFD93D", 0.8),
  balloon(320, 260, 0.85, "#FF9F45", 0.85),
  dot(150, 40, 3, "#FFFFFF", 0.7),
  dot(260, 300, 4, "#FFFFFF", 0.6),
  dot(30, 150, 2.5, "#FFFFFF", 0.6),
  star(180, 320, 8, "#FFE27A", 0.7),
  star(340, 160, 7, "#FFFFFF", 0.6),
].join("");

const OCEAN_SVG = [
  fish(70, 60, 1.1, "#FFD93D", 0.9),
  fish(260, 100, 0.9, "#FF9F45", 0.85),
  fish(160, 220, 1.2, "#FFFFFF", 0.85),
  fish(320, 290, 0.8, "#FFD93D", 0.8),
  dot(40, 300, 6, "#FFFFFF", 0.5),
  dot(120, 320, 4, "#FFFFFF", 0.45),
  dot(280, 40, 5, "#FFFFFF", 0.5),
  dot(200, 150, 3, "#FFFFFF", 0.5),
  dot(340, 200, 4, "#FFFFFF", 0.45),
  wave(90, 160, 60, "#FFFFFF", 0.4),
  wave(280, 340, 60, "#FFFFFF", 0.35),
  star(40, 120, 9, "#FFE27A", 0.8),
  star(230, 300, 8, "#FFFFFF", 0.7),
].join("");

const BUBBLEGUM_SVG = [
  heart(60, 60, 26, "#FFFFFF", 0.85),
  heart(280, 90, 20, "#FFD93D", 0.8),
  heart(150, 250, 30, "#FFFFFF", 0.8),
  heart(320, 300, 18, "#FF6B6B", 0.8),
  star(200, 60, 10, "#FFFFFF", 0.8),
  star(40, 220, 9, "#FFD93D", 0.75),
  star(300, 200, 8, "#FFFFFF", 0.75),
  sparkle(120, 130, 8, "#FFFFFF", 0.8),
  sparkle(250, 260, 7, "#FFFFFF", 0.7),
  sparkle(340, 130, 6, "#FFD93D", 0.7),
  dot(90, 320, 4, "#FFFFFF", 0.6),
  dot(180, 170, 3, "#FFFFFF", 0.6),
].join("");

const FOREST_SVG = [
  sun(310, 55, 22, "#FFE27A", 0.9),
  tree(60, 90, 1.3, "#2F9E44", "#8B5A2B", 0.9),
  tree(140, 60, 0.9, "#6BCB77", "#8B5A2B", 0.85),
  tree(280, 200, 1.2, "#2F9E44", "#8B5A2B", 0.85),
  tree(40, 260, 1, "#6BCB77", "#8B5A2B", 0.85),
  mushroom(200, 300, 1.1, "#FF6B6B", "#FFFFFF", 0.9),
  mushroom(320, 320, 0.8, "#FF9F45", "#FFFFFF", 0.85),
  flower(150, 200, 6, "#FF8FB1", "#FFD93D", 0.85),
  flower(250, 100, 5, "#FFFFFF", "#FFD93D", 0.85),
  flower(90, 330, 5, "#FFD93D", "#FF9F45", 0.8),
  dot(200, 50, 3, "#FFFFFF", 0.6),
].join("");

const GALAXY_SVG = [
  moon(280, 70, 22, "#FFE27A", 0.95),
  planet(80, 260, 20, "#5AC8FA", "#FFD93D", 0.9),
  planet(320, 220, 12, "#FF8FB1", "#FFFFFF", 0.85),
  star(60, 60, 8, "#FFFFFF", 0.9),
  star(150, 40, 6, "#FFD93D", 0.85),
  star(200, 150, 7, "#FFFFFF", 0.8),
  star(30, 180, 5, "#FFFFFF", 0.75),
  star(320, 320, 8, "#FFFFFF", 0.85),
  star(120, 300, 6, "#FFD93D", 0.75),
  star(250, 40, 5, "#FFFFFF", 0.7),
  sparkle(180, 250, 7, "#FFFFFF", 0.8),
  sparkle(40, 320, 6, "#5AC8FA", 0.7),
  dot(100, 120, 2.5, "#FFFFFF", 0.7),
  dot(300, 140, 2.5, "#FFFFFF", 0.7),
].join("");

const RAINBOW_SVG = [
  `<path d="M40,220 A110,110 0 0 1 260,220" fill="none" stroke="#FF6B6B" stroke-width="10" opacity="0.85"/>`,
  `<path d="M40,220 A110,110 0 0 1 260,220" fill="none" stroke="#FFD93D" stroke-width="10" opacity="0.85" transform="translate(0,10)"/>`,
  `<path d="M40,220 A110,110 0 0 1 260,220" fill="none" stroke="#6BCB77" stroke-width="10" opacity="0.85" transform="translate(0,20)"/>`,
  `<path d="M40,220 A110,110 0 0 1 260,220" fill="none" stroke="#5AC8FA" stroke-width="10" opacity="0.85" transform="translate(0,30)"/>`,
  cloud(30, 230, 0.7, "#FFFFFF", 0.85),
  cloud(270, 230, 0.7, "#FFFFFF", 0.85),
  sun(320, 60, 20, "#FFE27A", 0.9),
  star(90, 60, 8, "#FFFFFF", 0.8),
  star(200, 320, 9, "#FFFFFF", 0.8),
  star(330, 300, 7, "#FFD93D", 0.75),
  dot(50, 320, 4, "#FFFFFF", 0.6),
  dot(150, 60, 3, "#FFFFFF", 0.6),
].join("");

export const CHAT_THEMES: ChatTheme[] = [
  {
    key: "sunset",
    label: "Sunset",
    emoji: "🌅",
    gradient: "linear-gradient(160deg, #FFD93D 0%, #FF9F45 45%, #FF6B6B 100%)",
    pattern: toDataUri(SUNSET_SVG, TILE),
    patternSize: TILE,
  },
  {
    key: "ocean",
    label: "Ocean",
    emoji: "🌊",
    gradient: "linear-gradient(160deg, #A0F0ED 0%, #5AC8FA 50%, #4ECDC4 100%)",
    pattern: toDataUri(OCEAN_SVG, TILE),
    patternSize: TILE,
  },
  {
    key: "bubblegum",
    label: "Bubblegum",
    emoji: "🍬",
    gradient: "linear-gradient(160deg, #FFD1E8 0%, #FF8FB1 50%, #A78BFA 100%)",
    pattern: toDataUri(BUBBLEGUM_SVG, TILE),
    patternSize: TILE,
  },
  {
    key: "forest",
    label: "Forest",
    emoji: "🌲",
    gradient: "linear-gradient(160deg, #DFF5D8 0%, #6BCB77 55%, #2F9E44 100%)",
    pattern: toDataUri(FOREST_SVG, TILE),
    patternSize: TILE,
  },
  {
    key: "galaxy",
    label: "Galaxy",
    emoji: "🌌",
    gradient: "linear-gradient(160deg, #A78BFA 0%, #6D5BD0 50%, #2E1F5E 100%)",
    pattern: toDataUri(GALAXY_SVG, TILE),
    patternSize: TILE,
  },
  {
    key: "rainbow",
    label: "Rainbow",
    emoji: "🌈",
    gradient:
      "linear-gradient(135deg, #FF6B6B 0%, #FFD93D 25%, #6BCB77 50%, #5AC8FA 75%, #A78BFA 100%)",
    pattern: toDataUri(RAINBOW_SVG, TILE),
    patternSize: TILE,
  },
];

export function findChatTheme(key: string | null) {
  return CHAT_THEMES.find((t) => t.key === key);
}
