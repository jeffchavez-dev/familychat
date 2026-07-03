-- Family Chat schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- One row per auth.users account (created automatically on signup via trigger below)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  avatar_key text,
  created_at timestamptz not null default now()
);

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  theme text,
  background_url text,
  avatar_key text,
  avatar_url text
);

create table if not exists thread_participants (
  thread_id uuid not null references threads (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (thread_id, user_id)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references threads (id) on delete cascade,
  sender_id uuid not null references profiles (id),
  body text,
  attachment_url text,
  attachment_type text,
  reply_to_id uuid references messages (id) on delete set null,
  created_at timestamptz not null default now(),
  -- 'game_note' rows are auto-posted when a mini-game finishes (e.g. "X and Y
  -- played Uno"); sent by the game's startedBy player like any other message,
  -- just rendered differently client-side. Everything else is 'text'.
  message_type text not null default 'text'
);

-- Existing databases created before message_type existed need this applied
-- manually (no migration runner in this project) — safe no-op if already run.
alter table messages add column if not exists message_type text not null default 'text';

create table if not exists message_reads (
  message_id uuid not null references messages (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists message_reactions (
  message_id uuid not null references messages (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists push_subscriptions (
  user_id uuid not null references profiles (id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, endpoint)
);

-- Auto-create a profile row whenever a new auth user is added (admin creates the 3 family accounts)
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security: everyone is a family member, but scope access to
-- threads/messages by participation so the model generalizes if you add members later.
alter table profiles enable row level security;
alter table threads enable row level security;
alter table thread_participants enable row level security;
alter table messages enable row level security;
alter table message_reads enable row level security;
alter table message_reactions enable row level security;
alter table push_subscriptions enable row level security;

create policy "profiles are viewable by any signed-in family member"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- A thread_participants policy that queries thread_participants itself causes
-- "infinite recursion detected in policy" — each row check re-triggers the
-- same policy. Route the check through a security-definer function instead,
-- which (owned by postgres, which has BYPASSRLS in Supabase) reads the table
-- without re-entering RLS.
create or replace function is_thread_participant(check_thread_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from thread_participants
    where thread_id = check_thread_id and user_id = auth.uid()
  );
$$;

create policy "participants can view their threads"
  on threads for select
  using (is_thread_participant(id));

create policy "signed-in users can create threads"
  on threads for insert
  with check (auth.role() = 'authenticated');

create policy "participants can update their threads"
  on threads for update
  using (is_thread_participant(id))
  with check (is_thread_participant(id));

create policy "participants can view thread membership"
  on thread_participants for select
  using (is_thread_participant(thread_id));

create policy "signed-in users can add participants"
  on thread_participants for insert
  with check (auth.role() = 'authenticated');

create policy "participants can view messages in their threads"
  on messages for select
  using (is_thread_participant(thread_id));

create policy "participants can send messages in their threads"
  on messages for insert
  with check (sender_id = auth.uid() and is_thread_participant(thread_id));

create policy "participants can view read receipts in their threads"
  on message_reads for select
  using (
    exists (
      select 1 from messages m
      where m.id = message_reads.message_id and is_thread_participant(m.thread_id)
    )
  );

create policy "users can mark messages read for themselves"
  on message_reads for insert
  with check (user_id = auth.uid());

create policy "participants can view reactions in their threads"
  on message_reactions for select
  using (
    exists (
      select 1 from messages m
      where m.id = message_reactions.message_id and is_thread_participant(m.thread_id)
    )
  );

create policy "participants can add their own reactions"
  on message_reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from messages m
      where m.id = message_reactions.message_id and is_thread_participant(m.thread_id)
    )
  );

create policy "users can remove their own reactions"
  on message_reactions for delete
  using (user_id = auth.uid());

create policy "users manage their own push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime: broadcast changes on messages and read receipts
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_reads;
alter publication supabase_realtime add table threads;
alter publication supabase_realtime add table message_reactions;

-- Storage bucket for chat attachments (photos/files)
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "family members can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

create policy "family members can view attachments"
  on storage.objects for select
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
