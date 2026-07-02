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

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleCreate() {
    if (selected.length === 0) return;
    setLoading(true);
    await onCreate(selected, selected.length > 1 ? name || null : null);
    setLoading(false);
    setOpen(false);
    setSelected([]);
    setName("");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="w-full">
            New chat
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.includes(m.id)}
                onCheckedChange={() => toggle(m.id)}
              />
              {m.full_name}
            </label>
          ))}
          {selected.length > 1 && (
            <Input
              placeholder="Group name (optional)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={selected.length === 0 || loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
