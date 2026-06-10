-- =============================================================================
-- DPR Analyzer Pro — Transactional credit operations
-- Apply this AFTER 03_milestone_variable_credits.sql in the Supabase SQL editor.
--
-- Why this exists:
--   Until now the Netlify functions performed "check balance → insert ledger
--   row → update job" as separate PostgREST calls. A crash mid-sequence could
--   leave inconsistent state, and two concurrent submissions could both pass
--   the balance check and drive the balance negative.
--
--   Each function below runs in a single transaction (plpgsql functions are
--   atomic) and serializes all credit mutations for a given user with a
--   transaction-scoped advisory lock, so the check-then-deduct is race-free.
--
-- All three are SECURITY DEFINER and executable ONLY by service_role —
-- they are called exclusively from Netlify functions, never the browser.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. confirm_dpr_submission — idempotent, balance-checked credit deduction.
--    Returns jsonb: status = 'ok' | 'already_confirmed' |
--    'insufficient_credits' | 'not_found' | 'forbidden'.
-- -----------------------------------------------------------------------------
create or replace function public.confirm_dpr_submission(
  p_user_id uuid,
  p_job_id bigint,
  p_total_size_bytes bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job      public.dpr_jobs%rowtype;
  v_credits  integer;
  v_balance  integer;
begin
  -- Serialize credit operations per user. xact-scoped: releases on
  -- commit/rollback automatically.
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));

  select * into v_job from public.dpr_jobs where id = p_job_id;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;
  if v_job.user_id <> p_user_id then
    return jsonb_build_object('status', 'forbidden');
  end if;

  -- Idempotency: a deduction already exists for this job.
  if exists (
    select 1 from public.credit_ledger
    where dpr_job_id = p_job_id and reason = 'dpr_submission'
  ) then
    return jsonb_build_object('status', 'already_confirmed');
  end if;

  v_credits := greatest(coalesce(v_job.credits_used, 1), 1);

  select coalesce(sum(delta), 0)::int into v_balance
  from public.credit_ledger
  where user_id = p_user_id;

  if v_balance < v_credits then
    return jsonb_build_object(
      'status',   'insufficient_credits',
      'balance',  v_balance,
      'required', v_credits
    );
  end if;

  insert into public.credit_ledger (user_id, delta, reason, dpr_job_id)
  values (p_user_id, -v_credits, 'dpr_submission', p_job_id);

  update public.dpr_jobs
  set total_size_bytes = p_total_size_bytes
  where id = p_job_id;

  return jsonb_build_object(
    'status',           'ok',
    'credits_deducted', v_credits,
    'new_balance',      v_balance - v_credits
  );
end;
$$;

revoke all on function public.confirm_dpr_submission(uuid, bigint, bigint) from public;
grant execute on function public.confirm_dpr_submission(uuid, bigint, bigint) to service_role;


-- -----------------------------------------------------------------------------
-- 2. admin_set_job_credits — operator confirms/adjusts the final credit cost.
--    Writes one signed band_adjustment ledger row (positive = refund,
--    negative = extra charge) and updates dpr_jobs.credits_used atomically.
--    Returns jsonb: status = 'ok' | 'not_found' | 'invalid'; delta.
-- -----------------------------------------------------------------------------
create or replace function public.admin_set_job_credits(
  p_job_id bigint,
  p_final_credits integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_prior   integer;
  v_delta   integer;
begin
  if p_final_credits is null or p_final_credits < 1 then
    return jsonb_build_object('status', 'invalid');
  end if;

  select user_id into v_user_id from public.dpr_jobs where id = p_job_id;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  -- Re-read under the lock — credits_used may have changed before we
  -- acquired it.
  select greatest(coalesce(credits_used, 1), 1) into v_prior
  from public.dpr_jobs where id = p_job_id;

  v_delta := v_prior - p_final_credits;
  if v_delta = 0 then
    return jsonb_build_object('status', 'ok', 'delta', 0);
  end if;

  insert into public.credit_ledger (user_id, delta, reason, dpr_job_id)
  values (v_user_id, v_delta, 'band_adjustment', p_job_id);

  update public.dpr_jobs
  set credits_used = p_final_credits
  where id = p_job_id;

  return jsonb_build_object('status', 'ok', 'delta', v_delta);
end;
$$;

revoke all on function public.admin_set_job_credits(bigint, integer) from public;
grant execute on function public.admin_set_job_credits(bigint, integer) to service_role;


-- -----------------------------------------------------------------------------
-- 3. admin_refund_job — idempotent full refund of a job's charged credits,
--    used when the operator flips a job to 'failed'.
--    Returns jsonb: status = 'ok' | 'already_refunded' | 'not_found'; delta.
-- -----------------------------------------------------------------------------
create or replace function public.admin_refund_job(
  p_job_id bigint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_credits integer;
begin
  select user_id into v_user_id from public.dpr_jobs where id = p_job_id;
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id::text, 0));

  if exists (
    select 1 from public.credit_ledger
    where dpr_job_id = p_job_id and reason = 'refund'
  ) then
    return jsonb_build_object('status', 'already_refunded', 'delta', 0);
  end if;

  select greatest(coalesce(credits_used, 1), 1) into v_credits
  from public.dpr_jobs where id = p_job_id;

  insert into public.credit_ledger (user_id, delta, reason, dpr_job_id)
  values (v_user_id, v_credits, 'refund', p_job_id);

  return jsonb_build_object('status', 'ok', 'delta', v_credits);
end;
$$;

revoke all on function public.admin_refund_job(bigint) from public;
grant execute on function public.admin_refund_job(bigint) to service_role;


-- -----------------------------------------------------------------------------
-- 4. Sanity checks
--
--    select proname, prosecdef from pg_proc
--     where proname in ('confirm_dpr_submission','admin_set_job_credits',
--                       'admin_refund_job');
--    -- → all three rows, prosecdef = true
-- -----------------------------------------------------------------------------
