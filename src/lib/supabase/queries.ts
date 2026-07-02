import { createClient } from "@/lib/supabase/client";
import type { Message, Profile, Thread } from "@/lib/types";

type RawThreadRow = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  theme: string | null;
  background_url: string | null;
  thread_participants: { profiles: Profile }[] | null;
};

export async function fetchThreads(): Promise<Thread[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("threads")
    .select(
      "id, is_group, name, created_at, theme, background_url, thread_participants(profiles(id, full_name, avatar_url, avatar_key))",
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
    participants: (t.thread_participants ?? [])
      .map((tp) => tp.profiles)
      .filter(Boolean),
  }));
}

type RawMessageRow = Omit<Message, "readBy"> & {
  message_reads: { user_id: string }[] | null;
};

export async function fetchMessages(threadId: string): Promise<Message[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*, message_reads(user_id)")
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
    created_at: m.created_at,
    readBy: (m.message_reads ?? []).map((r) => r.user_id),
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

export async function sendMessage(params: {
  threadId: string;
  senderId: string;
  body: string | null;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}) {
  const supabase = createClient();

  const { error } = await supabase.from("messages").insert({
    thread_id: params.threadId,
    sender_id: params.senderId,
    body: params.body,
    attachment_url: params.attachmentUrl ?? null,
    attachment_type: params.attachmentType ?? null,
  });

  if (error) throw error;
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
