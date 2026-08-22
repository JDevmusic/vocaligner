-- Story 6.1: Saved Songs schema.
--
-- Run this in the Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query),
-- or via `supabase db push` if you set up the Supabase CLI later -- neither is required for
-- this to work, pasting it into the dashboard's SQL Editor and running it once is enough.
--
-- This table only ever stores a REFERENCE to an existing generation (its id, already a
-- randomUUID() per this project's own conventions) -- it deliberately does NOT duplicate
-- the chain/reasoning/research data itself, which stays exactly where it already lives (the
-- existing Upstash-backed generation store). See ARCHITECTURE-SPINE.md's AD-13 candidate.

create table if not exists public.saved_songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Not a foreign key: the generation this points to lives in Upstash, a completely
  -- separate store this database has no knowledge of -- this is a plain reference, not a
  -- relational constraint Postgres can verify.
  generation_id uuid not null,
  saved_at timestamptz not null default now(),
  -- Saving the same generation twice is a no-op, not a duplicate row (Story 6.3's AC) --
  -- enforced here at the database level, not left to application code to get right.
  unique (user_id, generation_id)
);

alter table public.saved_songs enable row level security;

-- Three narrow policies (select/insert/delete) rather than one broad "for all" policy, so
-- each grant is exactly as wide as a real user action needs (view your list, save, and --
-- not yet in this story's scope, but harmless to allow now -- un-save). No update policy:
-- a saved_songs row has nothing on it a user would ever legitimately edit in place.
create policy "Users can view their own saved songs"
  on public.saved_songs for select
  using (auth.uid () = user_id);

create policy "Users can save songs to their own account"
  on public.saved_songs for insert
  with check (auth.uid () = user_id);

create policy "Users can remove their own saved songs"
  on public.saved_songs for delete
  using (auth.uid () = user_id);

-- Speeds up Story 6.4's "list my saved songs" query (WHERE user_id = ... ORDER BY saved_at
-- DESC) -- RLS's own `auth.uid() = user_id` check benefits from this index too.
create index if not exists saved_songs_user_id_saved_at_idx on public.saved_songs (user_id, saved_at desc);
