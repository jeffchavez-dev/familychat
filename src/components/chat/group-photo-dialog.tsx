"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { cn } from "@/lib/utils";
import type { Thread } from "@/lib/types";

export function GroupPhotoDialog({
  thread,
  onSetAvatarKey,
  onSetAvatarPhoto,
  trigger,
}: {
  thread: Thread;
  onSetAvatarKey: (key: string) => Promise<void>;
  onSetAvatarPhoto: (file: File) => Promise<void>;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePickAvatar(key: string) {
    setBusy(true);
    setError(null);
    try {
      await onSetAvatarKey(key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update the group photo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      await onSetAvatarPhoto(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't upload the photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">
            Group photo
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <FunAvatar
              id={thread.id}
              avatarKey={thread.avatar_key}
              avatarUrl={thread.avatar_url}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {AVATAR_PALETTE.map((preset) => (
              <button
                key={preset.key}
                type="button"
                disabled={busy}
                onClick={() => handlePickAvatar(preset.key)}
                className={cn(
                  "flex items-center justify-center rounded-2xl p-1.5 transition-transform hover:scale-105 active:scale-95",
                  thread.avatar_key === preset.key && !thread.avatar_url && "ring-2 ring-primary",
                )}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-xl"
                  style={{ backgroundColor: preset.bg }}
                >
                  {preset.emoji}
                </span>
              </button>
            ))}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full font-semibold"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            🖼️ Use a photo from my device
          </Button>
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
