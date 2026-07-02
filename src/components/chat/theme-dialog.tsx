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
import { CHAT_THEMES } from "@/lib/chat-themes";
import { cn } from "@/lib/utils";

export function ThemeDialog({
  currentTheme,
  hasBackgroundPhoto,
  onSetTheme,
  onSetBackgroundPhoto,
}: {
  currentTheme: string | null;
  hasBackgroundPhoto: boolean;
  onSetTheme: (theme: string | null) => Promise<void>;
  onSetBackgroundPhoto: (file: File) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSetTheme(theme: string | null) {
    setBusy(true);
    setError(null);
    try {
      await onSetTheme(theme);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't change the theme.");
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
      await onSetBackgroundPhoto(file);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't set the photo background.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="ml-auto rounded-full text-lg"
            aria-label="Customize chat"
          >
            🎨
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">
            Make it yours!
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleSetTheme(null)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl p-2 text-xs font-semibold transition-transform hover:scale-105 active:scale-95",
                !currentTheme && !hasBackgroundPhoto && "ring-2 ring-primary",
              )}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 bg-muted text-2xl">
                ✨
              </span>
              Default
            </button>
            {CHAT_THEMES.map((theme) => (
              <button
                key={theme.key}
                type="button"
                disabled={busy}
                onClick={() => handleSetTheme(theme.key)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl p-2 text-xs font-semibold transition-transform hover:scale-105 active:scale-95",
                  currentTheme === theme.key && "ring-2 ring-primary",
                )}
              >
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full text-2xl shadow-inner"
                  style={{ background: theme.gradient }}
                >
                  {theme.emoji}
                </span>
                {theme.label}
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
