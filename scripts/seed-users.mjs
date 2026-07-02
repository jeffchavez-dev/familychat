// Creates (or updates the password for) the family accounts listed in
// scripts/seed-users.local.json — a gitignored file, never committed.
//
// Usage:
//   node --env-file=.env.local scripts/seed-users.mjs
//
// Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
// (from a real Supabase project — placeholders will fail).

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function usernameToEmail(name) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}@familychat.local`;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey || url.includes("placeholder")) {
    console.error(
      "Missing or placeholder Supabase credentials in .env.local. Finish Supabase setup first (see README.md).",
    );
    process.exit(1);
  }

  const localFile = path.join(__dirname, "seed-users.local.json");
  let users;
  try {
    users = JSON.parse(await readFile(localFile, "utf8"));
  } catch {
    console.error(
      `Could not read ${localFile}. Create it as a JSON array of { "name": "...", "password": "..." }.`,
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const { name, password } of users) {
    const email = usernameToEmail(name);

    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (!createError) {
      console.log(`Created ${name} (${email})`);
      continue;
    }

    if (createError.code !== "email_exists") {
      console.error(`Failed to create ${name}:`, createError.message);
      continue;
    }

    // Already exists — update the password instead.
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`Failed to look up existing user ${name}:`, listError.message);
      continue;
    }

    const existing = list.users.find((u) => u.email === email);
    if (!existing) {
      console.error(`${name} reported as existing but not found in user list.`);
      continue;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { full_name: name },
    });

    if (updateError) {
      console.error(`Failed to update ${name}:`, updateError.message);
    } else {
      console.log(`Updated password for ${name} (${email})`);
    }
  }
}

main();
