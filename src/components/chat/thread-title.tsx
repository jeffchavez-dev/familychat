import type { Profile, Thread } from "@/lib/types";

export function threadTitle(thread: Thread, currentUserId: string) {
  if (thread.is_group) {
    return thread.name || thread.participants.map((p) => p.full_name).join(", ");
  }
  const other = thread.participants.find((p: Profile) => p.id !== currentUserId);
  return other?.full_name ?? "Unknown";
}
