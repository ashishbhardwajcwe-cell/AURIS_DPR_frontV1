# Operator Runbook

Day-2 operations for DPR Analyzer Pro. Everything below assumes you're
signed in as an admin and have access to the Supabase SQL editor. The
portal UI handles 90% of these tasks — this file is the escape hatch
when the UI can't, or when the audit trail needs forensics.

For first-time setup, see **[SETUP.md](SETUP.md)** instead.

---

## Contents

- [Credits](#credits)
- [Jobs](#jobs)
- [Accounts](#accounts)
- [Storage](#storage)
- [Email & notifications](#email--notifications)
- [Payments (Razorpay)](#payments-razorpay)
- [Cron jobs](#cron-jobs)
- [Audit log queries](#audit-log-queries)
- [Backup & data export](#backup--data-export)
- [Common incidents](#common-incidents)

---

## Credits

### Grant credits via the UI

`/admin/clients` → row → **Grant** → enter amount + reason → save.
This is the recommended path; it writes the ledger row AND an audit
entry through `/api/admin/grant-credits`.

### Grant credits via SQL (emergency)

If the UI is unreachable or you need to backdate:

```sql
insert into credit_ledger (user_id, delta, reason, created_at)
  values (
    (select id from profiles where email = 'client@firm.com'),
    20,           -- positive to grant, negative to take away
    'grant',      -- 'grant' | 'refund' | 'expiry' | 'razorpay_purchase'
    now()         -- or a backdated timestamp
  );
```

Then write a matching audit row so the forensic trail is clean:

```sql
insert into audit_log (user_id, action, metadata)
  values (
    (select id from profiles where email = 'YOU@firm.com'),
    'manual_grant_sql',
    jsonb_build_object(
      'targetUserId', (select id from profiles where email='client@firm.com'),
      'delta', 20,
      'reason', 'grant',
      'note', 'why you did this manually'
    )
  );
```

### Reverse an accidental grant

Insert the inverse delta with reason `refund`:

```sql
insert into credit_ledger (user_id, delta, reason)
  values (
    (select id from profiles where email = 'client@firm.com'),
    -20,
    'refund'
  );
```

The ledger is append-only by design — never `UPDATE` or `DELETE`
historical rows.

### Look up a firm's balance

```sql
select credit_balance(
  (select id from profiles where email = 'client@firm.com')
);
```

Or for everyone at once:

```sql
select p.company_name, p.email, p.status,
       coalesce(sum(cl.delta), 0) as balance
  from profiles p
  left join credit_ledger cl on cl.user_id = p.id
  group by p.id
  order by balance desc;
```

### Inspect a firm's credit history

```sql
select created_at, delta, reason, dpr_job_id
  from credit_ledger
  where user_id = (select id from profiles where email = 'client@firm.com')
  order by created_at desc
  limit 50;
```

---

## Jobs

### Find a stuck job

```sql
-- Submitted jobs older than 24 hours that have no credit deduction
-- (typically the orphan reaper handles these, but it runs nightly).
select id, user_id, project_name, submitted_at
  from dpr_jobs j
  where status = 'submitted'
    and submitted_at < now() - interval '24 hours'
    and not exists (
      select 1 from credit_ledger
      where dpr_job_id = j.id and reason = 'dpr_submission'
    );

-- Jobs sitting in 'in_review' longer than expected
select id, project_name, submitted_at,
       now() - submitted_at as age
  from dpr_jobs
  where status = 'in_review'
  order by submitted_at;
```

### Manually deliver a report (UI is the recommended path)

`/admin/jobs/:id` does this end-to-end. If you need the SQL path
(say, the file was uploaded by a different tool):

```sql
update dpr_jobs
   set status            = 'completed',
       completed_at      = now(),
       report_path       = '<user_id>/<job_id>/report-<name>.pdf',
       audio_path        = '<user_id>/<job_id>/audio-<name>.mp3',
       operator_summary  = 'Reviewed the geometric design and pavement
                            composition. See the report for the full
                            IRC compliance matrix.'
 where id = <job-id>;
```

Then fire the client email separately (the admin UI does this with the
"Email the client" checkbox):

```js
// from the admin's browser console
const s = (await window.supabase.auth.getSession()).data.session;
await fetch('/api/notify-completed', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer ' + s.access_token
  },
  body: JSON.stringify({ jobId: <id> })
}).then(r => r.json()).then(console.log);
```

### Refund a failed job

The admin UI does this automatically when you flip a job to "Failed"
(idempotent — won't double-refund). To do it manually:

```sql
update dpr_jobs
   set status = 'failed',
       completed_at = now(),
       operator_summary = 'Drawings were missing the cross-section
         sheets we need for the IRC:73 review. Re-upload with sheets
         DGN-001 to DGN-018 included.'
 where id = <job-id>;

-- Only insert the refund if one doesn't already exist
insert into credit_ledger (user_id, delta, reason, dpr_job_id)
  select user_id, 1, 'refund', id
    from dpr_jobs
    where id = <job-id>
      and not exists (
        select 1 from credit_ledger
        where dpr_job_id = <job-id> and reason = 'refund'
      );
```

---

## Accounts

### Approve / suspend via the UI

`/admin/clients` → row → Approve / Suspend / Reactivate. The server
refuses to let you suspend your own account.

### Promote someone to admin

```sql
update profiles
  set role = 'admin', status = 'active'
  where email = 'them@firm.com';
```

There's no UI for this — admin promotion is intentionally SQL-only.

### Demote an admin

```sql
update profiles
  set role = 'client'
  where email = 'them@firm.com';
```

### Delete an account (GDPR-style purge)

This cascades through every table:

```sql
delete from auth.users
  where email = 'former-client@firm.com';
```

The `on delete cascade` on `profiles.id`, `dpr_jobs.user_id`, and
`credit_ledger.user_id` removes everything. `audit_log.user_id` is
`on delete set null` so the historical actions survive but lose the
attribution.

Storage objects are NOT cascade-deleted by Postgres. Pair the SQL
delete with a manual storage cleanup:

```sql
-- find their files first
select bucket_id, name
  from storage.objects
  where (storage.foldername(name))[1] = '<their-user-uuid>'
    and bucket_id in ('dpr-uploads','dpr-reports');
```

Then in the Supabase dashboard, Storage → bucket → delete that folder.

---

## Storage

### Audit storage usage per firm

```sql
select
  (storage.foldername(name))[1] as user_id,
  bucket_id,
  count(*) as file_count,
  pg_size_pretty(sum((metadata->>'size')::bigint)) as total_size
from storage.objects
where bucket_id in ('dpr-uploads','dpr-reports')
group by 1, 2
order by sum((metadata->>'size')::bigint) desc nulls last;
```

### Find an orphan file (in storage but not referenced by any job)

```sql
with referenced as (
  select unnest(upload_paths) as path from dpr_jobs
  union
  select report_path from dpr_jobs where report_path is not null
  union
  select audio_path  from dpr_jobs where audio_path  is not null
)
select bucket_id, name
  from storage.objects
  where bucket_id in ('dpr-uploads','dpr-reports')
    and name not in (select path from referenced where path is not null);
```

If anything surfaces, the retention or orphan reaper missed it — safe
to delete manually.

---

## Email & notifications

### "Did the email actually send?"

Every send writes an audit row. Search by recipient:

```sql
select created_at, action, metadata
  from audit_log
  where action in (
    'operator_notified',
    'completion_notified',
    'balance_reminder_sent'
  )
    and metadata::text ilike '%client@firm.com%'
  order by id desc;
```

The `metadata.sent` boolean tells you whether Resend accepted the
request; `metadata.skipped` is true when env vars weren't set.

### Resend a client "report ready" email

Use the `/api/notify-completed` snippet from
[Manually deliver a report](#manually-deliver-a-report-ui-is-the-recommended-path) —
it doesn't mutate state, it just re-sends.

### Resend the operator alert for a missed submission

There's no dedicated endpoint. Easier path: trigger another submission
from the client side, or compose a one-off email via the Resend
dashboard if you need to back-fill.

---

## Payments (Razorpay)

### Find a specific payment

```sql
select created_at, user_id, action, metadata
  from audit_log
  where action in ('razorpay_order_created', 'razorpay_payment_applied')
    and metadata->>'razorpayPaymentId' = 'pay_xxxxxxx'
  order by id;
```

### Recent purchases

```sql
select a.created_at,
       p.company_name,
       a.metadata->>'packId' as pack,
       (a.metadata->>'credits')::int as credits,
       (a.metadata->>'priceInr')::int as price_inr,
       a.metadata->>'source' as source
  from audit_log a
  left join profiles p on p.id = a.user_id
  where a.action = 'razorpay_payment_applied'
  order by a.id desc
  limit 50;
```

### Detect a webhook-vs-client race

Both source values land in the audit log; if the client verified
first, `source='client_verify'` wins and the webhook becomes a no-op
(`alreadyApplied: true`). If the webhook arrives first,
`source='webhook'` wins. Either is fine — the idempotency anchor is the
Razorpay payment id, not the source.

```sql
-- Payments that landed via the webhook (user closed the tab)
select created_at, user_id, metadata->>'razorpayPaymentId' as payment_id
  from audit_log
  where action = 'razorpay_payment_applied'
    and metadata->>'source' = 'webhook'
  order by created_at desc
  limit 50;
```

### A payment Razorpay marked successful but we never credited

Cross-check Razorpay's dashboard against:

```sql
select a.metadata->>'razorpayOrderId' as order_id
  from audit_log a
  where a.action = 'razorpay_order_created'
    and a.created_at > now() - interval '7 days'
  except
  select a.metadata->>'razorpayOrderId'
    from audit_log a
    where a.action = 'razorpay_payment_applied'
      and a.created_at > now() - interval '7 days';
```

If an order id appears in the diff but Razorpay shows the payment as
captured, the webhook never reached us (DNS, signing key, network).
Replay the webhook from the Razorpay dashboard, or manually credit:

```sql
-- Look up the order's notes from Razorpay's dashboard to get the
-- userId, packId, and credits, then:
insert into credit_ledger (user_id, delta, reason)
  values ('<userId>', <credits>, 'razorpay_purchase');

insert into audit_log (user_id, action, metadata)
  values (
    '<userId>',
    'razorpay_payment_applied',
    jsonb_build_object(
      'razorpayPaymentId', 'pay_xxx',
      'razorpayOrderId',   'order_xxx',
      'packId',            'standard',
      'credits',            10,
      'priceInr',           11500,
      'source',             'manual_recovery',
      'note',               'webhook never arrived; verified in Razorpay dashboard'
    )
  );
```

### Refund a Razorpay payment

Two steps — they're independent and order doesn't matter:

1. Refund the money in **Razorpay dashboard → Payments → the row →
   Refund**. Razorpay sends the customer their own refund email.
2. Take the credits back in our ledger:

```sql
insert into credit_ledger (user_id, delta, reason, dpr_job_id)
  values ('<userId>', -<credits>, 'refund', null);
```

There's no special `reason` for "Razorpay reversal" — `refund` is the
correct enum value (it's a credit-side reduction, regardless of cause).

### Change pricing

Edit BOTH files and redeploy:

- `netlify/functions/_lib/packs.js`
- `src/lib/packs.js`

The pack id is the join key — never reuse an id for a different pack.
If you need to retire a pack, leave it in the file with a comment so
historical audit_log rows still resolve.

---

## Cron jobs

### Manual invocation

```bash
npx netlify functions:invoke cron-retention
npx netlify functions:invoke cron-orphan-reaper
npx netlify functions:invoke cron-credit-expiry
npx netlify functions:invoke cron-balance-reminders
```

Each prints a one-line summary. Same payload lands in `audit_log`.

### Cron history

```sql
select created_at, action, metadata
  from audit_log
  where action like 'cron_%'
  order by id desc
  limit 20;
```

### Tunable env vars

Edit in **Netlify → Site settings → Environment variables** and trigger
a redeploy:

- `RETENTION_DAYS` (default 30)
- `ORPHAN_AGE_HOURS` (default 24)
- `CREDIT_EXPIRY_MONTHS` (default 12)
- `LOW_BALANCE_THRESHOLD` (default 3)

### Verification recipes

**Test retention.** Backdate a completed job so the cron picks it up:

```sql
update dpr_jobs
   set completed_at = now() - interval '31 days'
 where id = <a-completed-job-id>;
```

Run `cron-retention`. The job row stays but `upload_paths`,
`report_path`, `audio_path` are cleared and the storage objects are
gone.

**Test the orphan reaper.** Insert a fake stale submitted job with no
ledger row:

```sql
insert into dpr_jobs (user_id, project_name, status, submitted_at)
  values (
    (select id from profiles where email='client@firm.com'),
    'TEST orphan',
    'submitted',
    now() - interval '2 days'
  )
  returning id;
```

Run `cron-orphan-reaper`. The row disappears.

**Test credit expiry.** Backdate a grant:

```sql
insert into credit_ledger (user_id, delta, reason, created_at)
  values (
    (select id from profiles where email='client@firm.com'),
    10,
    'grant',
    now() - interval '13 months'
  );
```

Run `cron-credit-expiry`. A new `delta=-10, reason='expiry'` row
appears. Run it again — nothing changes (idempotent).

**Test balance reminders.** Bring a test client to balance ≤ 3, then:

```bash
npx netlify functions:invoke cron-balance-reminders
```

They receive the low-balance email; `balance_reminder_sent` lands in
the audit log. Running again does nothing until they get a positive
ledger entry.

---

## Audit log queries

### Everything for a single job

```sql
select created_at, user_id, action, metadata
  from audit_log
  where (metadata->>'jobId')::int = <job-id>
  order by created_at;
```

### Everything by a single admin

```sql
select created_at, action, metadata
  from audit_log
  where user_id = (select id from profiles where email = 'admin@firm.com')
  order by created_at desc
  limit 100;
```

### All credit grants in the last 30 days

```sql
select a.created_at,
       a.metadata->>'targetCompany' as firm,
       (a.metadata->>'delta')::int as delta,
       a.metadata->>'reason' as reason
  from audit_log a
  where a.action = 'admin_grant_credits'
    and a.created_at > now() - interval '30 days'
  order by a.created_at desc;
```

### Recent downloads (who accessed what)

```sql
select a.created_at,
       p.company_name,
       a.metadata->>'kind' as kind,
       a.metadata->>'path' as path
  from audit_log a
  left join profiles p on p.id = a.user_id
  where a.action = 'download_url_minted'
  order by a.id desc
  limit 50;
```

---

## Backup & data export

### Full database backup

Supabase runs daily backups automatically on paid plans. For an
on-demand snapshot, use the Supabase dashboard → Database → Backups.

### Export one firm's data (DSAR-style request)

```sql
-- profile + balance
select * from profiles where email = 'client@firm.com';
select credit_balance((select id from profiles where email='client@firm.com'));

-- their jobs
select * from dpr_jobs
  where user_id = (select id from profiles where email='client@firm.com')
  order by submitted_at;

-- their credit history
select * from credit_ledger
  where user_id = (select id from profiles where email='client@firm.com')
  order by created_at;

-- their audit trail
select * from audit_log
  where user_id = (select id from profiles where email='client@firm.com')
  order by created_at;
```

Export each result as CSV from the Supabase SQL editor.

---

## Common incidents

### "My balance is wrong"

1. Pull the full ledger ordered by `created_at` (see
   [Inspect a firm's credit history](#inspect-a-firms-credit-history))
2. Sum the deltas manually — match against the UI's claimed balance
3. If the UI shows a different number, refresh the dashboard; the
   `credit_balance(uid)` RPC is the single source of truth
4. If the SUM is genuinely wrong, look for unexpected `dpr_submission`
   or `expiry` rows and trace via `dpr_job_id`

### "I never received the report-ready email"

1. Run the audit query in
   [Did the email actually send?](#did-the-email-actually-send)
2. If `sent=true`: check spam, check Resend → Logs for the bounce
3. If `skipped=true`: env vars aren't set; configure Resend and re-fire
   `/api/notify-completed`
4. If no row exists at all: the admin saved the job but didn't tick
   "Email the client". Re-fire via the snippet above

### "The upload page hangs at 99%"

Most likely the TUS upload completed but the network died before
`confirm-upload`. The job is in `submitted` status with no ledger row;
the orphan reaper will clean it up within 24 hours, OR the user can
click **Cancel upload** on the upload page to clear it immediately.

### "An admin made a typo when granting credits"

Reverse via SQL (see
[Reverse an accidental grant](#reverse-an-accidental-grant)) and add
an `audit_log` entry explaining the correction.

### "A client says their account was suspended unfairly"

```sql
-- Trace the action
select created_at, user_id as admin_id, metadata
  from audit_log
  where action = 'admin_set_profile_status'
    and metadata->>'targetUserId' =
        (select id from profiles where email='client@firm.com')::text
  order by created_at desc;
```

Reactivate via `/admin/clients` or:

```sql
update profiles set status='active' where email='client@firm.com';
```

### "I paid for credits but they never arrived"

1. Get the Razorpay payment id from the client (it's on Razorpay's
   receipt email and on `/pricing` if they retry — Razorpay shows
   recent payments)
2. Run the [Find a specific payment](#find-a-specific-payment) query
3. If `razorpay_payment_applied` is missing, run the
   ["A payment Razorpay marked successful but we never credited"](#a-payment-razorpay-marked-successful-but-we-never-credited)
   recovery
4. If `razorpay_payment_applied` exists but the client's balance is
   wrong, check the ledger directly — the row should be there

### "Storage costs are climbing"

Run [Audit storage usage per firm](#audit-storage-usage-per-firm).
Confirm retention is running (search audit_log for `cron_retention`).
If retention is silent, check that completed jobs have `completed_at`
set — without it, retention has no cutoff to compare against.
