"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { cn } from "@/lib/utils";
import type { Profile, Thread } from "@/lib/types";

export function GroupSettingsDialog({
  thread,
  allProfiles,
  onSetAvatarKey,
  onSetAvatarPhoto,
  onAddParticipants,
  trigger,
}: {
  thread: Thread;
  allProfiles: Profile[];
  onSetAvatarKey: (key: string) => Promise<void>;
  onSetAvatarPhoto: (file: File) => Promise<void>;
  onAddParticipants: (userIds: string[]) => Promise<void>;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const memberIds = new Set(thread.participants.map((p) => p.id));
  const addable = allProfiles.filter((p) => !memberIds.has(p.id));

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

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleAdd() {
    if (selected.length === 0) return;
    setAdding(true);
    setError(null);
    try {
      await onAddParticipants(selected);
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add member.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">
            Group settings
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

          <div className="space-y-2">
            <p className="text-sm font-bold text-foreground">Members</p>
            {thread.participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 px-2 py-1 text-sm font-semibold">
                <FunAvatar id={p.id} avatarKey={p.avatar_key} avatarUrl={p.avatar_url} size="sm" />
                {p.full_name}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-foreground">Add member</p>
            {addable.length === 0 ? (
              <p className="px-2 text-sm text-muted-foreground">Everyone&apos;s already in this group!</p>
            ) : (
              addable.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-semibold hover:bg-muted"
                >
                  <Checkbox checked={selected.includes(p.id)} onCheckedChange={() => toggle(p.id)} />
                  <FunAvatar id={p.id} avatarKey={p.avatar_key} avatarUrl={p.avatar_url} size="sm" />
                  {p.full_name}
                </label>
              ))
            )}
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        {addable.length > 0 && (
          <DialogFooter>
            <Button
              onClick={handleAdd}
              disabled={selected.length === 0 || adding}
              className="rounded-full font-bold"
            >
              {adding ? "Adding..." : "Add 🎉"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
