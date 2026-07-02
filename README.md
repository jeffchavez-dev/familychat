# Family Chat

A private, installable chat app for the family. Next.js (App Router) + Tailwind + shadcn/ui, backed by Supabase (auth, database, realtime, storage) and deployed on Vercel.

## Features

- Username + password login (no email, no public signup) — just first name and a PIN/password, kid-friendly
- 1:1 and group chat threads with realtime messages
- Photo/file sharing via Supabase Storage
- Read receipts and online presence
- Installable PWA with push notifications (Web Push, works across devices)

## Setup

### 1. Supabase project

1. Create a free project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, RLS policies, the `attachments` storage bucket, and a trigger that auto-creates a `profiles` row for each new auth user.
3. In **Authentication > Settings**, turn off "Allow new users to sign up" — accounts are only created by you, never by strangers.
4. Copy **Project Settings > API**: `Project URL`, `anon public` key, and `service_role` key (server-only, keep secret).

### 2. Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
NOTIFY_WEBHOOK_SECRET=
```

Generate the VAPID keys for push notifications:

```
npx web-push generate-vapid-keys
```

`NOTIFY_WEBHOOK_SECRET` can be any random string (e.g. `openssl rand -hex 32`).

### 3. Create family accounts

Login only asks for a name, but Supabase Auth needs an email under the hood — the app maps each name to a private synthetic address like `mira@familychat.local` (see `src/lib/username.ts`). To create accounts:

1. Create `scripts/seed-users.local.json` (gitignored, never committed) as a JSON array:
   ```json
   [
     { "name": "Mira", "password": "..." },
     { "name": "Dad Jeff", "password": "..." }
   ]
   ```
2. Run:
   ```
   npm run seed:users
   ```
   This creates each account (or updates the password if it already exists) and sets their display name via the `profiles` trigger. Re-run any time to change a password.

### 4. Push notification webhook (optional but recommended)

To send a push notification whenever a message is sent, add a **Database Webhook** in Supabase (Database > Webhooks):

- Table: `messages`
- Events: `Insert`
- Type: HTTP Request → `POST https://your-deployed-app.vercel.app/api/notify`
- Headers: `Authorization: Bearer <NOTIFY_WEBHOOK_SECRET>` (same value as the env var)

### 5. Run locally

```
npm install
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`. Sign in with the name and password of one of the accounts you seeded.

### 6. Replace the placeholder icons

`public/icons/icon-192.png` and `icon-512.png` are solid-color placeholders. Swap in real app icons before you install this on your family's phones.

### 7. Deploy

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the same environment variables from `.env.local` in the Vercel project settings.
4. Deploy. Once live, update the Supabase Database Webhook URL to point at your production domain.

Each family member installs the app by visiting the deployed URL on their phone/laptop and choosing "Add to Home Screen" (or the browser's install prompt), then logs in with their own account — sessions are independent per device.
