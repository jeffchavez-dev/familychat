"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { enablePushNotifications } from "@/lib/push/subscribe";

export function EnablePushButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<"idle" | "enabling" | "enabled" | "error">("idle");

  async function handleClick() {
    setStatus("enabling");
    try {
      await enablePushNotifications(userId);
      setStatus("enabled");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  if (status === "enabled") {
    return <p className="px-1 text-xs text-muted-foreground">Notifications on</p>;
  }

  return (
    <Button variant="outline" size="sm" className="w-full" onClick={handleClick} disabled={status === "enabling"}>
      {status === "error" ? "Retry notifications" : "Enable notifications"}
    </Button>
  );
}
