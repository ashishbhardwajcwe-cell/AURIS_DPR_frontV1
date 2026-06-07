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

## Milestone 5 — upload flow

The browser uploads files **directly** to Supabase Storage. Two Netlify
Functions broker the handshake. Nothing in this repo ever parses a file.

### Wire the server-side env vars in Netlify

The functions need the **service-role key** in addition to the URL/anon
already set up:

- [ ] In Netlify → Site settings → Environment variables, add:
  - `SUPABASE_SERVICE_ROLE_KEY` — from Supabase project settings → API
  - (Optional) `OPERATOR_EMAIL` — placeholder for Milestone 8

### Test it locally

The dev experience uses the Netlify CLI to proxy both Vite and the
functions through a single port (so `/api/*` and the React app share an
origin):

```bash
npm install -g netlify-cli   # one-time
netlify dev                  # boots Vite + functions, usually on :8888
```

Open <http://localhost:8888> and:

- [ ] Log in as a client that has been activated + given ≥ 1 credit
- [ ] Click **Upload a DPR**, fill in project name, drop a small `.pdf`
      or `.xlsx`
- [ ] Watch the per-file progress bar fill and the overall bar follow
- [ ] On success you should be redirected to `/jobs/:id`
- [ ] In Supabase → Storage → `dpr-uploads` you should see the file at
      `{user_id}/{job_id}/{safe_name}`
- [ ] In Supabase → SQL editor: `select * from credit_ledger order by id desc limit 5;`
      shows a new `-1, reason='dpr_submission'` row
- [ ] `select * from audit_log order by id desc limit 5;` shows a
      `dpr_submitted` entry

### Validations the API enforces

| Rule | Where |
| --- | --- |
| User is signed in + `status='active'` | `requireActiveClient` |
| `credit_balance ≥ 1` | `request-upload` (live RPC) |
| Each file ≤ 300 MB, total ≤ 500 MB | `validateFiles` (and client mirror) |
| Allowed extensions: xlsx/xls/csv/pdf/docx/zip | `validateFiles` |
| Filenames stripped to `[A-Za-z0-9._-]` | `safeFilename` |
| Credit deducted only after a successful upload | `/api/confirm-upload` |
| Double-confirm is a no-op | ledger pre-check in `confirm-upload` |

### Files > 50 MB

The client switches to **TUS resumable** via `tus-js-client`. A dropped
connection resumes from the last completed chunk (6 MB). Smaller files
use a single PUT to the signed URL with native XHR progress.

## Milestone 6 — cancel-upload + get-download-url

Two more Netlify Functions land in this milestone. No new env vars; the
existing `SUPABASE_SERVICE_ROLE_KEY` is enough.

| Endpoint | Used by | What it does |
| --- | --- | --- |
| `/api/cancel-upload` | Cancel button on Upload page | Deletes any partially-uploaded bytes from `dpr-uploads`, deletes the `dpr_jobs` row, writes an `upload_cancelled` audit entry. Refuses to cancel a confirmed job (one with a `dpr_submission` ledger row) — those belong to the operator queue. |
| `/api/get-download-url` | Job detail (M7) + admin (M9) | Mints a 10-minute Supabase signed URL for `kind=report` / `audio` (job owner OR admin) or `kind=upload` + `uploadIndex` (admin only). Writes a `download_url_minted` audit entry. |

Smoke test for cancel:

- [ ] Start an upload of a large-ish file
- [ ] While the progress bar is moving, click **Cancel upload**
- [ ] Confirm the job disappears from the dashboard
- [ ] In SQL: `select * from audit_log where action='upload_cancelled'
      order by id desc limit 1;` shows the entry
- [ ] In Storage → `dpr-uploads/{user_id}/`, the abandoned files are gone

Smoke test for downloads (you'll exercise this fully in Milestone 7):

```sh
# from a logged-in browser tab, with jobId from the URL:
fetch('/api/get-download-url', {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    authorization: 'Bearer ' + (await window.supabase.auth.getSession()).data.session.access_token
  },
  body: JSON.stringify({ jobId: 1, kind: 'report' })
}).then(r => r.json()).then(console.log);
```

Expect a 404 ("No report file is available for this job yet.") until you
upload a report path into the job row — that's the admin flow in
Milestone 9.

## Milestone 7 — job detail page

`/jobs/:jobId` is now the real client-facing job view: status timeline,
deliverables card (with report download + inline audio player), failed
state with refund acknowledgement, realtime updates that work for both
job owners and admins.

### End-to-end smoke (needs Milestones 2–6 applied)

The proper admin flow lands in Milestone 9; for now you can fake the
operator deliverables straight from SQL + the Supabase storage UI.

- [ ] Sign in as a client and upload any PDF/XLSX from `/upload`
- [ ] Note the resulting `/jobs/:id` URL
- [ ] The page should show the **Submitted** step active and the
      "In our queue" message
- [ ] Flip to in-review in SQL:
      ```sql
      update dpr_jobs set status='in_review' where id = <id>;
      ```
      The badge + timeline should update without a refresh (realtime)
- [ ] Manually drop a `report.pdf` and `audio.mp3` into Supabase
      Storage → `dpr-reports/<user_id>/<job_id>/` and mark the job done:
      ```sql
      update dpr_jobs
        set status        = 'completed',
            completed_at  = now(),
            report_path   = '<user_id>/<job_id>/report.pdf',
            audio_path    = '<user_id>/<job_id>/audio.mp3',
            operator_summary = 'Reviewed the geometric design and pavement composition. See the report for the full IRC compliance matrix.'
        where id = <id>;
      ```
- [ ] Without refreshing, the page should flip to **Completed**, show
      the summary, render the inline audio player, and offer the
      Download report button
- [ ] Click **Download report (PDF)** → the file downloads
- [ ] Press play on the audio player → the MP3 streams

### Failed state

- [ ] Pick another job and run:
      ```sql
      update dpr_jobs
        set status   = 'failed',
            completed_at = now(),
            operator_summary = 'Drawings were missing the cross-section sheets we need for the IRC:73 review. Re-upload with sheets DGN-001 to DGN-018 included.'
        where id = <id>;
      insert into credit_ledger (user_id, delta, reason, dpr_job_id)
        values ((select user_id from dpr_jobs where id=<id>), 1, 'refund', <id>);
      ```
- [ ] The page shows the failure note + "Your credit has been refunded"
- [ ] Dashboard balance bumps back up via the realtime subscription

## Milestone 8 — Resend transactional emails

Two emails:

| Trigger | From | To | Subject |
| --- | --- | --- | --- |
| `confirm-upload` fires after credit is deducted | `RESEND_FROM_EMAIL` (reply-to = client's email) | `OPERATOR_EMAIL` | `New DPR submitted — {project} ({company})` |
| `/api/notify-completed` (called by the admin UI in M9) | `RESEND_FROM_EMAIL` | client's email | `Your DPR Analysis Report is ready — {project}` |

Both templates render at `netlify/functions/_lib/templates.js` with
inline-styled, table-based HTML for Outlook compatibility, plus a
plain-text fallback.

### Set up Resend

- [ ] Sign up at <https://resend.com> and add your sending domain
- [ ] Add the DNS records Resend shows you (SPF, DKIM) at your registrar
- [ ] Wait for the domain status to flip to **Verified**
- [ ] Generate an API key (Settings → API Keys → New)
- [ ] In Netlify → Site settings → Environment variables, add:
  - `RESEND_API_KEY`
  - `RESEND_FROM_EMAIL` — must be on a verified domain, e.g. `noreply@dpranalyzer.com`
  - `OPERATOR_EMAIL` — where new-upload alerts go (your inbox)
  - `VITE_APP_URL` — production portal URL, used to build deep links in emails

Without these env vars, the upload flow still works — both emails
silently no-op and a single console log line is written
(`[email] skipped — RESEND_API_KEY/RESEND_FROM_EMAIL not set…`). Wire
them in whenever you're ready to receive notifications.

### Optional: Make.com webhook

- [ ] (Optional) Set `MAKE_WEBHOOK_URL` to forward submission events to
      a Make.com scenario (e.g., copy the file into a Drive folder).
      Payload: `{ event, jobId, userId, companyName, contactName, email,
      projectName, roadStretch, fileCount, totalSizeBytes, uploadPaths,
      adminUrl }`.

### Smoke test

- [ ] Submit a DPR from a client account → operator inbox receives the
      "New DPR submitted" email; the CTA opens `/jobs/:id` (you'll see
      the "Admin view" pill if you're signed in as admin)
- [ ] In `audit_log` you should see two rows for the submission:
      `dpr_submitted` (deduction) and `operator_notified` (email
      outcome: `sent` true / `skipped` false)
- [ ] To test the client email before M9 wires it into the admin UI,
      from the browser console while signed in as **admin**:
      ```js
      const s = (await window.supabase.auth.getSession()).data.session;
      await fetch('/api/notify-completed', {
        method: 'POST',
        headers: { 'content-type':'application/json', authorization:'Bearer '+s.access_token },
        body: JSON.stringify({ jobId: <id> })
      }).then(r => r.json()).then(console.log);
      ```
      (The job must already be in `status='completed'` — the function
      refuses otherwise.) The client receives the report-ready email;
      `audit_log` gets a `completion_notified` row.

Preview the rendered HTML by saving any payload into
`/tmp/preview.html` and opening it — `docs/email-previews/` is not
checked in so the production templates can stay the single source of
truth.

## Misc

- [ ] Replace `/public/auris-logo.svg` placeholder with the real brand asset
- [ ] Drop a real mutual NDA PDF at `/public/auris-nda-template.pdf`
- [ ] Verify Resend sender domain (Milestone 8)
- [ ] Wire `OPERATOR_EMAIL` to the inbox that should receive new-upload
      alerts (Milestone 8)
