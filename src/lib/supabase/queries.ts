import { createClient } from "@/lib/supabase/client";
import type { Message, Profile, Thread } from "@/lib/types";

type RawThreadRow = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  theme: string | null;
  background_url: string | null;
  avatar_key: string | null;
  avatar_url: string | null;
  thread_participants: { profiles: Profile }[] | null;
};

export async function fetchThreads(): Promise<Thread[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("threads")
    .select(
      "id, is_group, name, created_at, theme, background_url, avatar_key, avatar_url, thread_participants(profiles(id, full_name, avatar_url, avatar_key))",
    )
    .order("created_at", { ascending: false })
    .returns<RawThreadRow[]>();

  if (error) throw error;

  return (data ?? []).map((t) => ({
    id: t.id,
    is_group: t.is_group,
    name: t.name,
    created_at: t.created_at,
    theme: t.theme,
    background_url: t.background_url,
    avatar_key: t.avatar_key,
    avatar_url: t.avatar_url,
    participants: (t.thread_participants ?? [])
      .map((tp) => tp.profiles)
      .filter(Boolean),
  }));
}

type RawMessageRow = Omit<Message, "readBy" | "reactions"> & {
  message_reads: { user_id: string }[] | null;
  message_reactions: { user_id: string; emoji: string }[] | null;
};

export async function fetchMessages(threadId: string): Promise<Message[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*, message_reads(user_id), message_reactions(user_id, emoji)")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .returns<RawMessageRow[]>();

  if (error) throw error;

  return (data ?? []).map((m) => ({
    id: m.id,
    thread_id: m.thread_id,
    sender_id: m.sender_id,
    body: m.body,
    attachment_url: m.attachment_url,
    attachment_type: m.attachment_type,
    reply_to_id: m.reply_to_id,
    created_at: m.created_at,
    message_type: m.message_type,
    readBy: (m.message_reads ?? []).map((r) => r.user_id),
    reactions: (m.message_reactions ?? []).map((r) => ({ emoji: r.emoji, userId: r.user_id })),
  }));
}

export async function createThread(
  currentUserId: string,
  otherUserIds: string[],
  name: string | null,
): Promise<string> {
  const supabase = createClient();
  const isGroup = otherUserIds.length > 1;
  // Generate the id client-side and skip .select() on insert: the "view
  // threads you participate in" RLS policy can't pass yet here because the
  // creator isn't added to thread_participants until the next insert below,
  // so asking Postgres to return the inserted row 403s.
  const threadId = crypto.randomUUID();

  const { error: threadError } = await supabase.from("threads").insert({
    id: threadId,
    is_group: isGroup,
    name: isGroup ? name : null,
    created_by: currentUserId,
  });

  if (threadError) throw threadError;

  const participantRows = [currentUserId, ...otherUserIds].map((user_id) => ({
    thread_id: threadId,
    user_id,
  }));

  const { error: participantsError } = await supabase
    .from("thread_participants")
    .insert(participantRows);

  if (participantsError) throw participantsError;

  return threadId;
}

export async function addThreadParticipants(threadId: string, userIds: string[]): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("thread_participants")
    .insert(userIds.map((userId) => ({ thread_id: threadId, user_id: userId })));
  if (error) throw error;
}

export async function sendMessage(params: {
  threadId: string;
  senderId: string;
  body: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  replyToId?: string | null;
}) {
  const supabase = createClient();

  const { error } = await supabase.from("messages").insert({
    thread_id: params.threadId,
    sender_id: params.senderId,
    body: params.body,
    attachment_url: params.attachmentUrl ?? null,
    attachment_type: params.attachmentType ?? null,
    reply_to_id: params.replyToId ?? null,
  });

  if (error) throw error;
}

export async function sendGameNote(threadId: string, senderId: string, body: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("messages").insert({
    thread_id: threadId,
    sender_id: senderId,
    body,
    message_type: "game_note",
  });
  if (error) throw error;
}

export async function toggleReaction(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<"added" | "removed"> {
  const supabase = createClient();

  const { data: deleted, error: deleteError } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .select();

  if (deleteError) throw deleteError;
  if (deleted && deleted.length > 0) return "removed";

  const { error: insertError } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: userId, emoji });

  if (insertError) throw insertError;
  return "added";
}

export async function markMessageRead(messageId: string, userId: string) {
  const supabase = createClient();
  await supabase
    .from("message_reads")
    .upsert({ message_id: messageId, user_id: userId }, { onConflict: "message_id,user_id" });
}

export async function uploadAttachment(threadId: string, file: File) {
  const supabase = createClient();
  const path = `${threadId}/${crypto.randomUUID()}-${file.name}`;

  const { error } = await supabase.storage.from("attachments").upload(path, file);
  if (error) throw error;

  return { path, type: file.type };
}

export async function setThreadTheme(threadId: string, theme: string | null) {
  const supabase = createClient();
  const { error } = await supabase
    .from("threads")
    .update({ theme, background_url: null })
    .eq("id", threadId);

  if (error) throw error;
}

export async function setThreadBackgroundPhoto(threadId: string, file: File) {
  const supabase = createClient();
  const path = `backgrounds/${threadId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("threads")
    .update({ background_url: path, theme: null })
    .eq("id", threadId);
  if (updateError) throw updateError;

  return path;
}

export async function setThreadAvatarKey(threadId: string, avatarKey: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("threads")
    .update({ avatar_key: avatarKey, avatar_url: null })
    .eq("id", threadId);

  if (error) throw error;
}

export async function setThreadAvatarPhoto(threadId: string, file: File) {
  const supabase = createClient();
  const path = `group-avatars/${threadId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("threads")
    .update({ avatar_url: path, avatar_key: null })
    .eq("id", threadId);
  if (updateError) throw updateError;

  return path;
}

export async function getSignedAttachmentUrl(path: string) {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("attachments")
    .createSignedUrl(path, 60 * 60);

  if (error) throw error;
  return data.signedUrl;
}

export async function setProfileAvatarKey(userId: string, avatarKey: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_key: avatarKey, avatar_url: null })
    .eq("id", userId);

  if (error) throw error;
}

export async function setProfileAvatarPhoto(userId: string, file: File) {
  const supabase = createClient();
  const path = `avatars/${userId}/${crypto.randomUUID()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("attachments")
    .upload(path, file);
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: path, avatar_key: null })
    .eq("id", userId);
  if (updateError) throw updateError;

  return path;
}

export async function updatePassword(newPassword: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function createFamilyMember(name: string, password: string): Promise<void> {
  const res = await fetch("/api/family-members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    throw new Error(error ?? "Couldn't add family member.");
  }
}

export async function hasPushSubscription(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return (count ?? 0) > 0;
}
