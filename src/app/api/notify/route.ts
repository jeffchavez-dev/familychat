import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

// Called by a Supabase Database Webhook configured on `messages` INSERT.
// Configure the webhook with an `Authorization: Bearer <NOTIFY_WEBHOOK_SECRET>` header.
export async function POST(request: Request) {
  const secret = process.env.NOTIFY_WEBHOOK_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    record: {
      id: string;
      thread_id: string;
      sender_id: string;
      body: string | null;
      attachment_type: string | null;
    };
  };

  const { thread_id, sender_id, body, attachment_type } = payload.record;

  webpush.setVapidDetails(
    "mailto:family-chat@example.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const supabase = createAdminClient();

  const [{ data: participants }, { data: sender }] = await Promise.all([
    supabase
      .from("thread_participants")
      .select("user_id")
      .eq("thread_id", thread_id)
      .neq("user_id", sender_id),
    supabase.from("profiles").select("full_name").eq("id", sender_id).single(),
  ]);

  const recipientIds = (participants ?? []).map((p) => p.user_id);
  if (recipientIds.length === 0) {
    return Response.json({ sent: 0 });
  }

  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth")
    .in("user_id", recipientIds);

  const notificationBody = body || (attachment_type ? "Sent an attachment" : "New message");
  const title = sender?.full_name ?? "Family Chat";

  const results = await Promise.allSettled(
    (subscriptions ?? []).map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body: notificationBody, url: "/" }),
      ),
    ),
  );

  const expired = (subscriptions ?? []).filter((sub, i) => {
    const result = results[i];
    return (
      result.status === "rejected" &&
      [404, 410].includes((result.reason as { statusCode?: number })?.statusCode ?? 0)
    );
  });

  if (expired.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in(
        "endpoint",
        expired.map((s) => s.endpoint),
      );
  }

  return Response.json({ sent: results.filter((r) => r.status === "fulfilled").length });
}
