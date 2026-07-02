"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { insertMention, mentionQueryAt } from "@/lib/mentions";
import { messagePreviewText } from "@/lib/message-preview";
import type { Message, Profile } from "@/lib/types";

const QUICK_EMOJIS = ["😂", "❤️", "👍", "🎉", "😢", "🐶"];

export function MessageInput({
  onSend,
  onSendAttachment,
  participants,
  replyingTo,
  replyingToSender,
  onCancelReply,
}: {
  onSend: (body: string, replyToId: string | null) => Promise<void>;
  onSendAttachment: (file: File) => Promise<void>;
  participants: Profile[];
  replyingTo: Message | null;
  replyingToSender: Profile | undefined;
  onCancelReply: () => void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const mentionMatches =
    mentionQuery !== null
      ? participants
          .filter((p) => p.full_name.toLowerCase().includes(mentionQuery.toLowerCase()))
          .slice(0, 5)
      : [];

  async function send(body: string) {
    if (!body || sending) return;
    setSending(true);
    setValue("");
    setMentionQuery(null);
    const replyToId = replyingTo?.id ?? null;
    onCancelReply();
    await onSend(body, replyToId);
    setSending(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setSending(true);
    await onSendAttachment(file);
    setSending(false);
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const newValue = e.target.value;
    setValue(newValue);
    const cursor = e.target.selectionStart ?? newValue.length;
    setMentionQuery(mentionQueryAt(newValue, cursor));
  }

  function pickMention(name: string) {
    const cursor = textareaRef.current?.selectionStart ?? value.length;
    const { value: newValue, cursor: newCursor } = insertMention(value, cursor, name);
    setValue(newValue);
    setMentionQuery(null);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
    });
  }

  return (
    <div className="space-y-2 border-t bg-card/60 p-3">
      {replyingTo && (
        <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-foreground">
              Replying to {replyingToSender?.full_name ?? "Unknown"}
            </p>
            <p className="truncate text-muted-foreground">{messagePreviewText(replyingTo)}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="shrink-0 rounded-full px-2 py-1 font-bold text-muted-foreground hover:bg-background"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => send(emoji)}
            disabled={sending}
            className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-lg transition-transform hover:scale-125 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="relative flex items-end gap-2">
        {mentionMatches.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-56 overflow-hidden rounded-2xl border bg-popover shadow-lg">
            {mentionMatches.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => pickMention(p.full_name)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold hover:bg-muted"
              >
                <FunAvatar id={p.id} avatarKey={p.avatar_key} avatarUrl={p.avatar_url} size="sm" />
                {p.full_name}
              </button>
            ))}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full text-lg"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
        >
          📎
        </Button>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(value.trim());
            } else if (e.key === "Escape") {
              setMentionQuery(null);
            }
          }}
          placeholder="Say something fun... (@ to mention)"
          className="field-sizing-fixed min-h-11 min-w-0 flex-1 resize-none rounded-2xl text-base"
          rows={1}
        />
        <Button
          type="button"
          onClick={() => send(value.trim())}
          disabled={sending || !value.trim()}
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full text-lg shadow-md shadow-primary/30 transition-transform active:scale-90"
        >
          🚀
        </Button>
      </div>
    </div>
  );
}
