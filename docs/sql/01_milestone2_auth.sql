-- =============================================================================
-- DPR Analyzer Pro — Milestone 2 schema
-- Apply this in the Supabase SQL editor BEFORE testing signup/login.
-- This file is a strict subset of the full schema in §5 of the project brief;
-- Milestone 3 will layer on credit_ledger, dpr_jobs, audit_log, and storage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. is_admin() helper — used by RLS on every protected table.
--    SECURITY DEFINER so it can read profiles regardless of caller policies.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. profiles table — one row per auth.users row.
--    company_name is intentionally nullable so Google OAuth signups can create
--    a profile and fill it in via /complete-profile. Application code refuses
--    to activate accounts without it.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  contact_name text,
  email        text not null,
  phone        text,
  role         text not null default 'client'
                 check (role in ('client', 'admin')),
  status       text not null default 'pending'
                 check (status in ('pending', 'active', 'suspended')),
  created_at   timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 3. Row-level security on profiles.
--    INSERT happens via the SECURITY DEFINER trigger below — no INSERT policy
--    is needed (and we explicitly don't want clients writing arbitrary rows).
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profile read" on public.profiles;
create policy "profile read"
  on public.profiles
  for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profile update" on public.profiles;
create policy "profile update"
  on public.profiles
  for update
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- A client must not be able to promote themselves to admin or active
    -- by editing their own row. Role / status changes happen only via the
    -- service-role key from a Netlify Function.
    and role   = (select role   from public.profiles where id = auth.uid())
    and status = (select status from public.profiles where id = auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 4. handle_new_user — trigger that mirrors auth.users into public.profiles.
--    Reads optional signup metadata (company_name, contact_name, phone) that
--    the client passes via supabase.auth.signUp({ options: { data: ... }}).
--    For Google OAuth, falls back to the Google profile name where possible.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    company_name,
    contact_name,
    phone,
    role,
    status
  )
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    coalesce(
      nullif(new.raw_user_meta_data ->> 'contact_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    'client',
    'pending'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 5. Sanity check: confirm the policies are wired up.
--    Run after applying:
--      select tablename, policyname from pg_policies where schemaname = 'public';
-- -----------------------------------------------------------------------------
