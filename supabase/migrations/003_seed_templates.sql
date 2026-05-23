-- Migration: seed built-in templates owned by a system user (MVP)
-- The system user has no auth credentials; it exists only to satisfy the
-- templates.user_id FK for global/built-in templates.

do $$
declare
  system_user_id constant uuid := '00000000-0000-0000-0000-000000000001';
begin
  -- System user (idempotent)
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

  -- og-basic template (idempotent on slug+user_id)
  insert into public.templates (slug, name, layout_id, width, height, layers, user_id)
  values (
    'og-basic',
    'OG Basic',
    'og-basic',
    1200, 630,
    '[]'::jsonb,
    system_user_id
  )
  on conflict (slug, user_id) do nothing;
end $$;
