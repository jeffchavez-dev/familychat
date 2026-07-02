import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatApp } from "@/components/chat/chat-app";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, avatar_key")
    .eq("id", user.id)
    .single();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, avatar_key");

  if (!profile) {
    redirect("/login");
  }

  return <ChatApp currentUser={profile} allProfiles={profiles ?? []} />;
}
