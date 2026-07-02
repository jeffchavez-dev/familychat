"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  async function handleSend() {
    const body = value.trim();
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
    <div className="flex items-end gap-2 border-t p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={sending}
      >
        +
      </Button>
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        className="min-h-10 flex-1 resize-none"
        rows={1}
      />
      <Button type="button" onClick={handleSend} disabled={sending || !value.trim()}>
        Send
      </Button>
    </div>
  );
}
