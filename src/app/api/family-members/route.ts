import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { usernameToEmail } from "@/lib/username";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, password } = (await request.json()) as { name?: string; password?: string };
  const trimmedName = name?.trim() ?? "";

  if (!trimmedName || !password || password.length < 6) {
    return Response.json(
      { error: "Name and a password of at least 6 characters are required." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.createUser({
    email: usernameToEmail(trimmedName),
    password,
    email_confirm: true,
    user_metadata: { full_name: trimmedName },
  });

  if (error) {
    const message = error.code === "email_exists" ? "That name is already taken." : error.message;
    return Response.json({ error: message }, { status: 400 });
  }

  return Response.json({ ok: true });
}
