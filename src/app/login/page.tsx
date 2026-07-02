"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { usernameToEmail } from "@/lib/username";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(name),
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-4xl shadow-lg shadow-primary/30">
            <img src="/logo.png" alt="Family Chat Logo" className="h-full w-full object-contain" />
          </span>
        </div>
        <Card className="border-2 border-border/60 shadow-xl shadow-primary/10">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-3xl tracking-wide text-primary">
              Family Chat
            </CardTitle>
            <CardDescription className="text-base">
              Who&apos;s saying hi today?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="username"
                className="h-12 rounded-2xl text-base"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="h-12 rounded-2xl text-base"
              />
              {error && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="h-12 w-full rounded-full text-base font-bold shadow-md shadow-primary/30 transition-transform active:scale-95"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Let's go! 🚀"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
