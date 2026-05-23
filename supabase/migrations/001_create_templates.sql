-- Migration: create templates table
create table if not exists public.templates (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  name        text not null,
  layout_id   text not null,
  width       integer not null default 1200,
  height      integer not null default 630,
  layers      jsonb not null default '[]',
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique(slug, user_id)
);

-- RLS
alter table public.templates enable row level security;

create policy "Users can manage their own templates"
  on public.templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
