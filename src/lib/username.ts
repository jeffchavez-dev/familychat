// Supabase Auth requires an email under the hood, but the app only shows
// family members a plain username. This maps a display name to a stable,
// private synthetic address used purely as the auth identifier.
export function usernameToEmail(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${slug}@familychat.local`;
}
