-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run.
-- It creates the submissions table and the access policies the static site needs.

create table if not exists public.submissions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  team_name text not null,
  total_members int not null,
  members jsonb not null default '[]'::jsonb,
  option text not null,
  area text not null
);

alter table public.submissions enable row level security;

-- Allow the public form (anon key) to insert new registrations.
create policy "anon can insert submissions"
  on public.submissions
  for insert
  to anon
  with check (true);

-- Allow the public dashboard (anon key) to read registrations.
create policy "anon can read submissions"
  on public.submissions
  for select
  to anon
  using (true);
