# Operator Setup Checklist

Live checklist for getting DPR Analyzer Pro running end to end. Tick items off
in order as you go.

## Milestone 1 — scaffold ✅

- [x] Repo scaffolded (Vite + React + Router)
- [x] AURIS-branded header & footer
- [x] Landing, Privacy, Confidentiality pages
- [x] Login stub (replaced in Milestone 2)
- [x] `netlify.toml` with SPA redirect

## Milestone 2 — Supabase Auth

Front-end code is in. Before sign-up / login will work end-to-end you need to:

### Supabase project

- [ ] Create a Supabase project in **ap-south-1 (Mumbai)** for data residency
- [ ] In **Authentication → Providers**, enable **Email** (turn email
      confirmation on if you want verified emails; off is fine for early
      testing)
- [ ] In **Authentication → Providers**, enable **Google** and paste the
      OAuth Client ID / Secret from Google Cloud
- [ ] In **Authentication → URL Configuration**:
  - **Site URL** → your Netlify URL (e.g. `https://portal.dpranalyzer.com`)
  - **Redirect URLs** → add `https://portal.dpranalyzer.com/auth/callback`
    **and** `http://localhost:5173/auth/callback`

### Google Cloud (for the Google OAuth provider)

- [ ] Create a new OAuth 2.0 Client (Web application) in Google Cloud
      Console
- [ ] Set Authorized JavaScript origins to the Netlify URL **and**
      `http://localhost:5173`
- [ ] Set Authorized redirect URIs to the Supabase callback URL
      (Supabase shows it on the Google provider config screen — it looks
      like `https://<project-ref>.supabase.co/auth/v1/callback`)

### Run the Milestone 2 SQL

- [ ] Open the Supabase SQL editor
- [ ] Paste and run `docs/sql/01_milestone2_auth.sql`
- [ ] Verify in **Database → Policies** that RLS is **enabled** on `profiles`
- [ ] Verify `select policyname from pg_policies where tablename='profiles';`
      returns `profile read` and `profile update`

### Wire env vars

- [ ] Locally: copy `.env.example` → `.env` and fill in
      `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] In Netlify (Site settings → Environment variables): set the same
      `VITE_*` values, plus `VITE_APP_URL` for the production domain

### Smoke test

- [ ] Sign up with email → check the email confirmation link works (if
      enabled), then sign in
- [ ] Sign in with Google → land on `/complete-profile` → fill in the form
- [ ] Either way you should land on `/dashboard` with a yellow
      "Pending approval" badge and banner
- [ ] In **Database → profiles**, promote yourself by updating your row:
      `update profiles set role='admin', status='active' where email='you@firm.com';`
- [ ] Refresh — the pending banner should disappear

## Milestone 3 — full schema

SQL is ready in `docs/sql/02_milestone3_schema.sql`. Apply it after the
Milestone 2 migration.

- [ ] Open the Supabase SQL editor
- [ ] Paste and run `docs/sql/02_milestone3_schema.sql`

The script creates **tables**, **indexes**, the `credit_balance(uid)` helper,
**RLS policies**, **storage buckets**, **storage policies**, and turns on
**realtime** for `dpr_jobs`.

Verify with the three sanity-check queries at the bottom of the file:

```sql
-- 1) tables exist
select table_name from information_schema.tables
  where table_schema = 'public' order by table_name;
-- expected: audit_log, credit_ledger, dpr_jobs, profiles

-- 2) policies are wired up
select tablename, policyname from pg_policies
  where schemaname in ('public','storage') order by tablename, policyname;
-- expected (public):
--   audit_log    : audit read
--   credit_ledger: credits read
--   dpr_jobs     : jobs read, jobs insert, jobs update
--   profiles     : profile read, profile update
-- expected (storage.objects):
--   admin writes reports, read own reports, read own uploads,
--   upload to own folder

-- 3) buckets exist and are private
select id, public, file_size_limit from storage.buckets
  where id in ('dpr-uploads','dpr-reports');
-- expected: both rows, public = false
```

If the `insert into storage.buckets` step throws a permission error (rare —
some older projects), create the two buckets manually in **Storage → New
bucket**:

- `dpr-uploads` — **uncheck** "Public bucket", set file size limit to 300 MB
- `dpr-reports` — **uncheck** "Public bucket", set file size limit to 200 MB

Then re-run just the policies section (everything from
`-- 5. Storage RLS policies` onward).

Optional smoke test once your account is admin/active:

```sql
-- give yourself 10 trial credits (server-side write, bypasses RLS)
insert into credit_ledger (user_id, delta, reason)
  values ((select id from profiles where email='you@firm.com'), 10, 'grant');

-- read it back via the helper
select credit_balance((select id from profiles where email='you@firm.com'));
-- expected: 10
```

## Milestone 4 — client dashboard

Front-end is in. The dashboard at `/dashboard` reads from the schema you
applied in Milestone 3 and subscribes to realtime updates on `dpr_jobs`.

End-to-end test (requires Milestones 2 + 3 applied):

- [ ] Sign in as a client account
- [ ] Confirm the "Pending approval" banner shows while
      `profiles.status = 'pending'`
- [ ] In SQL, activate the account and grant 5 credits:
      ```sql
      update profiles set status='active' where email='client@firm.com';
      insert into credit_ledger (user_id, delta, reason) values
        ((select id from profiles where email='client@firm.com'), 5, 'grant');
      ```
- [ ] Reload the dashboard — the pending banner disappears, the balance
      card reads **5**, and the "Upload a DPR" button is active
- [ ] Insert a fake job in SQL and confirm it appears in the jobs table
      without a manual refresh (realtime):
      ```sql
      insert into dpr_jobs (user_id, project_name, road_stretch, status)
        values (
          (select id from profiles where email='client@firm.com'),
          'NH-44 widening — Hyderabad to Nagpur',
          'KM 144+200 to 188+500',
          'submitted'
        );
      ```
- [ ] Update its status and watch the badge flip live:
      ```sql
      update dpr_jobs set status='in_review' where project_name like 'NH-44%';
      ```

## Misc

- [ ] Replace `/public/auris-logo.svg` placeholder with the real brand asset
- [ ] Drop a real mutual NDA PDF at `/public/auris-nda-template.pdf`
- [ ] Verify Resend sender domain (Milestone 8)
- [ ] Wire `OPERATOR_EMAIL` to the inbox that should receive new-upload
      alerts (Milestone 8)
