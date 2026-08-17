-- App-wide runtime settings. Read/written only via service-role Netlify Functions.
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id)
);

-- Seed departmental defaults: billing hidden, BRO branding.
insert into public.app_settings (key, value) values
  ('billing_enabled', 'false'::jsonb),
  ('active_brand',    '"bro"'::jsonb)
on conflict (key) do nothing;

-- Enable RLS with NO policies -> anon/auth clients cannot touch it directly.
-- The service role (used by /api/settings and /api/admin/set-setting) bypasses RLS.
alter table public.app_settings enable row level security;
