import type { Profile } from "@/lib/types";

export function mentionQueryAt(value: string, cursor: number): string | null {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(?:^|\s)@([a-zA-Z]*)$/);
  return match ? match[1] : null;
}

export function insertMention(value: string, cursor: number, name: string) {
  const beforeCursor = value.slice(0, cursor);
  const afterCursor = value.slice(cursor);
  const newBefore = beforeCursor.replace(/@([a-zA-Z]*)$/, `@${name} `);
  return { value: newBefore + afterCursor, cursor: newBefore.length };
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type MessageSegment = { text: string } | { mention: string };

export function splitMentions(body: string, participants: Profile[]): MessageSegment[] {
  if (participants.length === 0) return [{ text: body }];

  const names = [...new Set(participants.map((p) => p.full_name))].sort(
    (a, b) => b.length - a.length,
  );
  const regex = new RegExp(`@(${names.map(escapeRegExp).join("|")})\\b`, "g");

  const segments: MessageSegment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body))) {
    if (match.index > lastIndex) segments.push({ text: body.slice(lastIndex, match.index) });
    segments.push({ mention: match[1] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) segments.push({ text: body.slice(lastIndex) });

  return segments;
}
