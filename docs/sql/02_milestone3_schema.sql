-- =============================================================================
-- DPR Analyzer Pro — Milestone 3 schema
-- Apply this AFTER 01_milestone2_auth.sql in the Supabase SQL editor.
--
-- What this file does:
--   1. Creates credit_ledger, dpr_jobs, audit_log tables (+ indexes)
--   2. Adds credit_balance(uid) helper
--   3. Enables row-level security + policies on all three tables
--   4. Creates the two private storage buckets (dpr-uploads, dpr-reports)
--   5. Adds the storage RLS policies (folder-per-user isolation)
--   6. Enables realtime on dpr_jobs so the client UI can stream status changes
--
-- After applying, verify in the Supabase dashboard:
--   - Storage shows two private buckets: dpr-uploads, dpr-reports
--   - Database → Policies lists policies on all 4 tables + storage.objects
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1a. credit_ledger — append-only credit history.
--     balance = sum(delta). Reasons: 'grant','dpr_submission','refund',
--     'expiry','razorpay_purchase' (Phase 2).
--     There are deliberately NO update/delete policies; the table is treated
--     as an immutable audit record. Writes happen only from Netlify Functions
--     using the service-role key, which bypasses RLS.
-- -----------------------------------------------------------------------------
create table if not exists public.credit_ledger (
  id          bigint generated always as identity primary key,
  user_id     uuid   not null references public.profiles(id) on delete cascade,
  delta       integer not null,
  reason      text   not null
                check (reason in (
                  'grant',
                  'dpr_submission',
                  'refund',
                  'expiry',
                  'razorpay_purchase'
                )),
  dpr_job_id  bigint,  -- soft FK; constraint added after dpr_jobs exists
  created_at  timestamptz not null default now()
);

create index if not exists credit_ledger_user_id_idx
  on public.credit_ledger (user_id);
create index if not exists credit_ledger_user_id_created_idx
  on public.credit_ledger (user_id, created_at desc);


-- -----------------------------------------------------------------------------
-- 1b. dpr_jobs — one row per DPR submission.
--     upload_paths is an array because a job can have several uploaded files.
--     report_path / audio_path are populated when the operator delivers.
-- -----------------------------------------------------------------------------
create table if not exists public.dpr_jobs (
  id                bigint generated always as identity primary key,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  project_name      text not null,
  road_stretch      text,
  notes             text,
  operator_summary  text,
  status            text not null default 'submitted'
                       check (status in (
                         'submitted',
                         'in_review',
                         'completed',
                         'failed',
                         'cancelled'
                       )),
  upload_paths      text[],
  report_path       text,
  audio_path        text,
  total_size_bytes  bigint,
  credits_used      integer not null default 1,
  submitted_at      timestamptz not null default now(),
  completed_at      timestamptz
);

create index if not exists dpr_jobs_user_id_idx
  on public.dpr_jobs (user_id);
create index if not exists dpr_jobs_user_id_submitted_idx
  on public.dpr_jobs (user_id, submitted_at desc);
create index if not exists dpr_jobs_status_idx
  on public.dpr_jobs (status);

-- Now that dpr_jobs exists, wire the soft FK from credit_ledger back to it.
-- On job delete we keep the ledger row but null out the link so the history
-- survives. (Profile deletion cascades to both tables independently.)
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'credit_ledger_dpr_job_id_fkey'
      and table_name = 'credit_ledger'
  ) then
    alter table public.credit_ledger
      add constraint credit_ledger_dpr_job_id_fkey
      foreign key (dpr_job_id)
      references public.dpr_jobs(id)
      on delete set null;
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 1c. audit_log — append-only. Captures logins, uploads, downloads, credit
--     changes, admin actions. Writes happen only from Netlify Functions.
-- -----------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  user_id     uuid references public.profiles(id) on delete set null,
  action      text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_user_id_idx
  on public.audit_log (user_id);
create index if not exists audit_log_created_idx
  on public.audit_log (created_at desc);
create index if not exists audit_log_action_idx
  on public.audit_log (action);


-- -----------------------------------------------------------------------------
-- 2. credit_balance(uid) — convenience function. Returns 0 for users with no
--    ledger entries. STABLE so PostgREST can call it from the client.
-- -----------------------------------------------------------------------------
create or replace function public.credit_balance(uid uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(delta), 0)::int
  from public.credit_ledger
  where user_id = uid;
$$;

-- Lock down direct execution so users can only query their own balance.
revoke all on function public.credit_balance(uuid) from public;
grant execute on function public.credit_balance(uuid) to authenticated;


-- -----------------------------------------------------------------------------
-- 3. Row-level security
-- -----------------------------------------------------------------------------
alter table public.credit_ledger enable row level security;
alter table public.dpr_jobs      enable row level security;
alter table public.audit_log     enable row level security;

-- credit_ledger: client reads own rows, admin reads all. No insert / update /
-- delete policies → those operations require the service-role key.
drop policy if exists "credits read" on public.credit_ledger;
create policy "credits read"
  on public.credit_ledger
  for select
  using (user_id = auth.uid() or public.is_admin());

-- dpr_jobs: clients can read & insert their own; admins can read & update all.
drop policy if exists "jobs read" on public.dpr_jobs;
create policy "jobs read"
  on public.dpr_jobs
  for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "jobs insert" on public.dpr_jobs;
create policy "jobs insert"
  on public.dpr_jobs
  for insert
  with check (user_id = auth.uid());

drop policy if exists "jobs update" on public.dpr_jobs;
create policy "jobs update"
  on public.dpr_jobs
  for update
  using (public.is_admin());

-- audit_log: only admins can read. Writes via service role.
drop policy if exists "audit read" on public.audit_log;
create policy "audit read"
  on public.audit_log
  for select
  using (public.is_admin());


-- -----------------------------------------------------------------------------
-- 4. Storage buckets
--    Both private. dpr-uploads holds client → operator files; dpr-reports
--    holds operator → client reports + audio. File-size cap is set per
--    bucket as defense in depth; the upload Function (Milestone 6) still
--    enforces caps server-side.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('dpr-uploads', 'dpr-uploads', false, 314572800),  -- 300 MB
  ('dpr-reports', 'dpr-reports', false, 209715200)   -- 200 MB
on conflict (id) do update
  set public          = excluded.public,
      file_size_limit = excluded.file_size_limit;
-- NOTE: if the insert above fails with a permission error in your project,
-- create both buckets manually in Storage → New bucket (uncheck "Public").


-- -----------------------------------------------------------------------------
-- 5. Storage RLS policies — folder-per-user isolation.
--    Path convention: {user_id}/{job_id}/{safe_filename}
--    storage.foldername(name) returns the path as a text[], so [1] is the
--    user_id segment. This is what isolates one firm's bytes from another's.
-- -----------------------------------------------------------------------------

-- client uploads into their OWN folder in dpr-uploads
drop policy if exists "upload to own folder" on storage.objects;
create policy "upload to own folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'dpr-uploads'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- client reads their own uploads; admin reads all uploads
drop policy if exists "read own uploads" on storage.objects;
create policy "read own uploads"
  on storage.objects
  for select
  using (
    bucket_id = 'dpr-uploads'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- client reads their own reports; admin reads all reports
drop policy if exists "read own reports" on storage.objects;
create policy "read own reports"
  on storage.objects
  for select
  using (
    bucket_id = 'dpr-reports'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

-- only admins write into dpr-reports (the service role bypasses RLS anyway,
-- so Netlify Functions can still upload on the admin's behalf)
drop policy if exists "admin writes reports" on storage.objects;
create policy "admin writes reports"
  on storage.objects
  for insert
  with check (
    bucket_id = 'dpr-reports'
    and public.is_admin()
  );


-- -----------------------------------------------------------------------------
-- 6. Realtime — let the client UI stream dpr_jobs status changes for live
--    "Submitted → In Review → Completed" timelines without polling.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'dpr_jobs'
  ) then
    alter publication supabase_realtime add table public.dpr_jobs;
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 7. Sanity checks
--    Run after applying to confirm everything wired up:
--
--    select table_name from information_schema.tables
--      where table_schema = 'public' order by table_name;
--    -- → audit_log, credit_ledger, dpr_jobs, profiles
--
--    select tablename, policyname from pg_policies
--      where schemaname in ('public','storage') order by tablename, policyname;
--    -- → policies on all four tables + storage.objects
--
--    select id, public, file_size_limit from storage.buckets
--      where id in ('dpr-uploads','dpr-reports');
--    -- → both rows, public = false
-- -----------------------------------------------------------------------------
