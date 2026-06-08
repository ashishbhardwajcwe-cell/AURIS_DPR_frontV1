-- =============================================================================
-- DPR Analyzer Pro — Variable-credit pricing migration
-- Apply this AFTER 02_milestone3_schema.sql in the Supabase SQL editor.
--
-- What this file does:
--   1. Adds three job-sizing columns to dpr_jobs (length_band, packages,
--      has_structures) so the operator can later re-band a job and see
--      how the client originally classified it.
--   2. Replaces the credit_ledger.reason CHECK constraint to allow
--      'band_adjustment', the new reason used when the operator's final
--      credit cost differs from the client's estimate.
--
-- No data backfill is required — existing rows keep length_band = NULL
-- (treated as "unspecified, legacy 1-credit job") and credits_used keeps
-- whatever the old flow inserted.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. dpr_jobs sizing columns
-- -----------------------------------------------------------------------------
alter table public.dpr_jobs
  add column if not exists length_band    text,
  add column if not exists packages       integer not null default 1,
  add column if not exists has_structures boolean not null default false;

-- Soft constraint: keep the allowed values aligned with
-- src/lib/estimateCredits.js (small | standard | larger | major | xl).
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'dpr_jobs_length_band_check'
      and table_name = 'dpr_jobs'
  ) then
    alter table public.dpr_jobs
      add constraint dpr_jobs_length_band_check
      check (length_band is null or length_band in (
        'small', 'standard', 'larger', 'major', 'xl'
      ));
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 2. Allow 'band_adjustment' as a credit_ledger reason
--    The original constraint hard-coded five reasons. We drop and re-add
--    it with the new value included so operator band re-classifications
--    can be written to the ledger as a signed delta.
-- -----------------------------------------------------------------------------
alter table public.credit_ledger
  drop constraint if exists credit_ledger_reason_check;

alter table public.credit_ledger
  add constraint credit_ledger_reason_check
  check (reason in (
    'grant',
    'dpr_submission',
    'refund',
    'expiry',
    'razorpay_purchase',
    'band_adjustment'
  ));


-- -----------------------------------------------------------------------------
-- 3. Sanity checks
--
--    select column_name, data_type, is_nullable, column_default
--      from information_schema.columns
--     where table_schema = 'public' and table_name = 'dpr_jobs'
--       and column_name in ('length_band','packages','has_structures');
--
--    select pg_get_constraintdef(oid)
--      from pg_constraint
--     where conname = 'credit_ledger_reason_check';
-- -----------------------------------------------------------------------------
