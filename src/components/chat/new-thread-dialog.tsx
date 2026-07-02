"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { FunAvatar } from "@/components/chat/fun-avatar";
import type { Profile } from "@/lib/types";

export function NewThreadDialog({
  members,
  onCreate,
}: {
  members: Profile[];
  onCreate: (otherUserIds: string[], name: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await onCreate(selected, selected.length > 1 ? name || null : null);
      setOpen(false);
      setSelected([]);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the chat.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="w-full rounded-full font-bold shadow-sm shadow-primary/20">
            ✨ New chat
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">
            Who do you want to chat with?
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {members.map((m) => (
            <label
              key={m.id}
              className="flex cursor-pointer items-center gap-2.5 rounded-2xl px-2 py-2 text-sm font-semibold hover:bg-muted"
            >
              <Checkbox
                checked={selected.includes(m.id)}
                onCheckedChange={() => toggle(m.id)}
              />
              <FunAvatar id={m.id} size="sm" />
              {m.full_name}
            </label>
          ))}
          {selected.length > 1 && (
            <Input
              placeholder="Group name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-2xl"
            />
          )}
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={selected.length === 0 || loading}
            className="rounded-full font-bold"
          >
            {loading ? "Creating..." : "Create 🎊"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
