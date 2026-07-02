"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const QUICK_EMOJIS = ["😂", "❤️", "👍", "🎉", "😢", "🐶"];

export function MessageInput({
  onSend,
  onSendAttachment,
}: {
  onSend: (body: string) => Promise<void>;
  onSendAttachment: (file: File) => Promise<void>;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function send(body: string) {
    if (!body || sending) return;
    setSending(true);
    setValue("");
    await onSend(body);
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

  return (
    <div className="space-y-2 border-t bg-card/60 p-3">
      <div className="flex gap-1.5">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => send(emoji)}
            disabled={sending}
            className="rounded-full bg-muted px-2.5 py-1 text-lg transition-transform hover:scale-125 active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
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
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(value.trim());
            }
          }}
          placeholder="Say something fun..."
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
