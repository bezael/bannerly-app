-- Bannerly initial schema
-- Single baseline migration for MVP: templates table, storage bucket,
-- built-in system templates, and RLS policies.

-- ============================================================================
-- 1. Templates table
-- ============================================================================

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

alter table public.templates enable row level security;

-- Users can read/write their own templates
create policy "Users can manage their own templates"
  on public.templates
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone can read built-in templates (those owned by the system user)
create policy "Anyone can read system templates"
  on public.templates
  for select
  to anon, authenticated
  using (user_id = '00000000-0000-0000-0000-000000000001'::uuid);

-- ============================================================================
-- 2. Storage bucket for rendered PNGs
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('bannerly-images', 'bannerly-images', true)
on conflict (id) do nothing;

-- Public read (rendered images are returned as public URLs)
create policy "Public read access for bannerly-images"
  on storage.objects
  for select
  using (bucket_id = 'bannerly-images');

-- Authenticated users can write to their own {uid}/... folder
create policy "Users can upload to their own folder"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'bannerly-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own objects"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'bannerly-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own objects"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'bannerly-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 3. Seed: system user + built-in templates
-- ============================================================================

do $$
declare
  system_user_id constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- System user owns built-in templates. No real credentials; exists only
  -- to satisfy the templates.user_id FK.
  insert into auth.users (
    id, instance_id, aud, role, email,
    encrypted_password, email_confirmed_at,
    created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    is_super_admin, is_sso_user, is_anonymous
  )
  values (
    system_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'system@bannerly.local',
    '', now(), now(), now(),
    '{"provider":"system","providers":["system"]}'::jsonb,
    '{}'::jsonb,
    false, false, false
  )
  on conflict (id) do nothing;

  insert into public.templates (slug, name, layout_id, width, height, layers, user_id)
  values (
    'og-basic', 'OG Basic', 'og-basic',
    1200, 630, '[]'::jsonb, system_user_id
  )
  on conflict (slug, user_id) do nothing;
end $$;
