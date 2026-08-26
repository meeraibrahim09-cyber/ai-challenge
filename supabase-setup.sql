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

-- Session feedback survey responses.
create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  rating int not null,
  enjoyed text not null default '',
  ideas text not null default '',
  expand text not null default '',
  improve text not null default ''
);

alter table public.survey_responses enable row level security;

-- Allow the public survey (anon key) to insert responses.
create policy "anon can insert survey_responses"
  on public.survey_responses
  for insert
  to anon
  with check (true);

-- Allow authenticated dashboard users to read responses.
create policy "authenticated can read survey_responses"
  on public.survey_responses
  for select
  to authenticated
  using (true);
