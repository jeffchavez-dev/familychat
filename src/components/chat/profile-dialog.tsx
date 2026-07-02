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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { FunAvatar } from "@/components/chat/fun-avatar";
import { AVATAR_PALETTE } from "@/lib/avatar-style";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function ProfileDialog({
  profile,
  onSetAvatarKey,
  onSetAvatarPhoto,
  onChangePassword,
  trigger,
}: {
  profile: Profile;
  onSetAvatarKey: (key: string) => Promise<void>;
  onSetAvatarPhoto: (file: File) => Promise<void>;
  onChangePassword: (password: string) => Promise<void>;
  trigger: React.ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handlePickAvatar(key: string) {
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await onSetAvatarKey(key);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't update your picture.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarBusy(true);
    setAvatarError(null);
    try {
      await onSetAvatarPhoto(file);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Couldn't upload your photo.");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (password.length < 4) {
      setPasswordError("Use at least 4 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords don't match.");
      return;
    }

    setPasswordBusy(true);
    try {
      await onChangePassword(password);
      setPassword("");
      setConfirmPassword("");
      setPasswordSuccess(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Couldn't update your password.");
    } finally {
      setPasswordBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPasswordError(null);
          setPasswordSuccess(false);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">
            {profile.full_name}&apos;s Profile
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <FunAvatar
              id={profile.id}
              avatarKey={profile.avatar_key}
              avatarUrl={profile.avatar_url}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {AVATAR_PALETTE.map((preset) => (
              <button
                key={preset.key}
                type="button"
                disabled={avatarBusy}
                onClick={() => handlePickAvatar(preset.key)}
                className={cn(
                  "flex items-center justify-center rounded-2xl p-1.5 transition-transform hover:scale-105 active:scale-95",
                  profile.avatar_key === preset.key &&
                    !profile.avatar_url &&
                    "ring-2 ring-primary",
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
            disabled={avatarBusy}
          >
            🖼️ Use a photo from my device
          </Button>
          {avatarError && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {avatarError}
            </p>
          )}

          <Separator />

          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <p className="font-heading text-base text-foreground">Change password</p>
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              className="h-11 rounded-2xl"
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="h-11 rounded-2xl"
            />
            {passwordError && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                Password updated! ✅
              </p>
            )}
            <Button
              type="submit"
              className="w-full rounded-full font-bold"
              disabled={passwordBusy || !password || !confirmPassword}
            >
              {passwordBusy ? "Updating..." : "Update password"}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
