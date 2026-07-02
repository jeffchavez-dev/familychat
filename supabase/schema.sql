-- Family Chat schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

-- One row per auth.users account (created automatically on signup via trigger below)
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists threads (
  id uuid primary key default gen_random_uuid(),
  is_group boolean not null default false,
  name text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
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
  created_at timestamptz not null default now()
);

create table if not exists message_reads (
  message_id uuid not null references messages (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (message_id, user_id)
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
alter table push_subscriptions enable row level security;

create policy "profiles are viewable by any signed-in family member"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "participants can view their threads"
  on threads for select
  using (
    exists (
      select 1 from thread_participants tp
      where tp.thread_id = threads.id and tp.user_id = auth.uid()
    )
  );

create policy "signed-in users can create threads"
  on threads for insert
  with check (auth.role() = 'authenticated');

create policy "participants can view thread membership"
  on thread_participants for select
  using (
    exists (
      select 1 from thread_participants tp
      where tp.thread_id = thread_participants.thread_id and tp.user_id = auth.uid()
    )
  );

create policy "signed-in users can add participants"
  on thread_participants for insert
  with check (auth.role() = 'authenticated');

create policy "participants can view messages in their threads"
  on messages for select
  using (
    exists (
      select 1 from thread_participants tp
      where tp.thread_id = messages.thread_id and tp.user_id = auth.uid()
    )
  );

create policy "participants can send messages in their threads"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from thread_participants tp
      where tp.thread_id = messages.thread_id and tp.user_id = auth.uid()
    )
  );

create policy "participants can view read receipts in their threads"
  on message_reads for select
  using (
    exists (
      select 1 from messages m
      join thread_participants tp on tp.thread_id = m.thread_id
      where m.id = message_reads.message_id and tp.user_id = auth.uid()
    )
  );

create policy "users can mark messages read for themselves"
  on message_reads for insert
  with check (user_id = auth.uid());

create policy "users manage their own push subscriptions"
  on push_subscriptions for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Realtime: broadcast changes on messages and read receipts
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table message_reads;

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
