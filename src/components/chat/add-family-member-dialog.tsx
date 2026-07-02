"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AddFamilyMemberDialog({
  onCreate,
}: {
  onCreate: (name: string, password: string) => Promise<void>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim() || password.length < 6) {
      setError("Name and a password of at least 6 characters are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onCreate(name.trim(), password);
      setOpen(false);
      setName("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add family member.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-full font-bold shadow-sm"
          >
            ➕ Add family member
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl text-primary">
            Add a family member
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="Their name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-2xl"
          />
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-2xl"
            />
            <p className="mt-1 px-2 text-xs text-muted-foreground">At least 6 characters</p>
          </div>
          {error && (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || password.length < 6 || loading}
            className="rounded-full font-bold"
          >
            {loading ? "Adding..." : "Add 🎉"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
