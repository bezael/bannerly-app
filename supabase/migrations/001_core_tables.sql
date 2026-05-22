-- api_keys
create table public.api_keys (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  key_hash      text not null unique,
  prefix        text not null,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "users see own api_keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "users insert own api_keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "users update own api_keys"
  on public.api_keys for update
  using (auth.uid() = user_id);

-- templates
create table public.templates (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  template_uid  text not null unique,
  name          text not null,
  width         int not null default 1200,
  height        int not null default 630,
  jsx_code      text not null,
  thumbnail_url text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.templates enable row level security;

create policy "users see own templates and seed templates"
  on public.templates for select
  using (auth.uid() = user_id or user_id is null);

create policy "users insert own templates"
  on public.templates for insert
  with check (auth.uid() = user_id);

create policy "users update own templates"
  on public.templates for update
  using (auth.uid() = user_id);

create policy "users delete own templates"
  on public.templates for delete
  using (auth.uid() = user_id);

-- generations
create table public.generations (
  id            text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  template_id   uuid not null references public.templates(id),
  image_url     text not null,
  modifications jsonb not null default '[]',
  render_ms     int,
  created_at    timestamptz not null default now()
);

alter table public.generations enable row level security;

create policy "users see own generations"
  on public.generations for select
  using (auth.uid() = user_id);

create policy "service role inserts generations"
  on public.generations for insert
  with check (true);
