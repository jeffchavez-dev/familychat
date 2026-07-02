// ‍ = zero-width joiner (combines emoji, e.g. family/couple emoji)
// ️ = variation selector (forces emoji presentation)
// \u{1F3FB}-\u{1F3FF} = skin tone modifiers
const EMOJI_ONLY_REGEX =
  /^[\p{Extended_Pictographic}‍️\u{1F3FB}-\u{1F3FF}\s]+$/u;

export function isEmojiOnly(text: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 16) return false;
  return EMOJI_ONLY_REGEX.test(trimmed);
}

export const REACTION_EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🎉"];
