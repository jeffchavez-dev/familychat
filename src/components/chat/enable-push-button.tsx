"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { enablePushNotifications } from "@/lib/push/subscribe";
import { hasPushSubscription } from "@/lib/supabase/queries";

export function EnablePushButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"checking" | "idle" | "enabling" | "enabled" | "error">(
    "checking",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hasPushSubscription(userId)
      .then((subscribed) => setStatus(subscribed ? "enabled" : "idle"))
      .catch(() => setStatus("idle"));
  }, [userId]);

  async function handleClick() {
    setStatus("enabling");
    setError(null);
    try {
      await enablePushNotifications(userId);
      setStatus("enabled");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Couldn't enable notifications.");
      setStatus("error");
    }
  }

  if (status === "checking") return null;

  if (status === "enabled") {
    return (
      <p className="px-1 text-xs font-semibold text-muted-foreground">
        🔔 Notifications on
      </p>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        variant="outline"
        size="sm"
        className="w-full rounded-full font-semibold"
        onClick={handleClick}
        disabled={status === "enabling"}
      >
        {status === "error" ? "Retry notifications" : "🔔 Enable notifications"}
      </Button>
      {error && <p className="px-1 text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
