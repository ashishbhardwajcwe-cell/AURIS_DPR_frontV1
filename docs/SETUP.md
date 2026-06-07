# First-Deploy Setup

A linear path from a fresh Supabase project + a fresh Netlify site to a
working DPR Analyzer Pro portal with one DPR submitted end-to-end. Expect
this to take 60–90 minutes the first time.

Once the portal is live, see **[RUNBOOK.md](RUNBOOK.md)** for day-2
operations (granting credits, triggering crons, troubleshooting email
delivery, etc.).

---

## Step 1 — Provision Supabase

1. Sign up at <https://supabase.com> and create a new project
2. Region: **`ap-south-1` (Mumbai)** for Indian data residency
3. Set a strong database password; save it in your password manager
4. From **Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (NEVER ship this
     in the browser)

## Step 2 — Run the SQL migrations

Open **SQL Editor** in the Supabase dashboard. Paste and run, in this
order:

1. `docs/sql/01_milestone2_auth.sql` — `profiles` table, `is_admin()`
   helper, RLS policies, `handle_new_user` trigger
2. `docs/sql/02_milestone3_schema.sql` — `credit_ledger`, `dpr_jobs`,
   `audit_log`, indexes, `credit_balance()`, RLS, storage buckets +
   policies, realtime publication

Verify with the three sanity-check queries at the bottom of file 02:

```sql
-- 1) tables exist
select table_name from information_schema.tables
  where table_schema = 'public' order by table_name;
-- expected: audit_log, credit_ledger, dpr_jobs, profiles

-- 2) policies are wired up
select tablename, policyname from pg_policies
  where schemaname in ('public','storage') order by tablename, policyname;
-- expected (public): audit read, credits read, jobs read/insert/update,
--                    profile read/update
-- expected (storage.objects): admin writes reports, read own reports,
--                              read own uploads, upload to own folder

-- 3) buckets exist and are private
select id, public, file_size_limit from storage.buckets
  where id in ('dpr-uploads','dpr-reports');
-- expected: both rows, public = false
```

If `insert into storage.buckets` throws a permission error in your
project (rare), create both buckets manually in **Storage → New bucket**:

- `dpr-uploads` — **uncheck** "Public bucket", file-size limit 300 MB
- `dpr-reports` — **uncheck** "Public bucket", file-size limit 200 MB

Then re-run just the policies section of the migration (everything from
`-- 5. Storage RLS policies` onward).

## Step 3 — Configure authentication

### Email/password

In **Authentication → Providers**, enable **Email**. Email confirmation
is on by default — leave it on for production, turn off if you want
faster local testing.

### Google OAuth

In **Authentication → Providers**, enable **Google** and paste an OAuth
client ID + secret. To get those:

1. Open <https://console.cloud.google.com> → APIs & Services → Credentials
2. **Create credentials → OAuth client ID → Web application**
3. **Authorized JavaScript origins**: your future Netlify URL **and**
   `http://localhost:5173`
4. **Authorized redirect URIs**: the value Supabase shows on the Google
   provider screen — looks like
   `https://<project-ref>.supabase.co/auth/v1/callback`
5. Paste the resulting Client ID + Secret back into Supabase

### URL configuration

In **Authentication → URL Configuration**:

- **Site URL**: your Netlify production URL (you can change this after
  the first deploy)
- **Redirect URLs**: add both of
  - `https://<your-netlify-domain>/auth/callback`
  - `http://localhost:5173/auth/callback`

## Step 4 — Provision Resend (email)

You can skip this for the first deploy — the portal works without email,
and the functions log `[email] skipped …` when keys are missing.

When you're ready:

1. Sign up at <https://resend.com>
2. Add your sending domain and set the SPF + DKIM DNS records at your
   registrar
3. Wait for the domain status to flip to **Verified**
4. Generate an API key (Settings → API Keys → New) → `RESEND_API_KEY`
5. Decide on a sender address on the verified domain →
   `RESEND_FROM_EMAIL` (e.g., `noreply@dpranalyzer.com`)
6. Pick an inbox to receive new-upload alerts → `OPERATOR_EMAIL`

## Step 5 — Deploy to Netlify

1. Push the repo to GitHub
2. In Netlify, **Add new site → Import from Git**, pick the repo
3. Build settings (auto-detected from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`
4. **Site settings → Environment variables** → add every variable from
   the [README's env-var table](../README.md#environment-variables):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `OPERATOR_EMAIL` (if Resend
     is set up)
   - Optional: `MAKE_WEBHOOK_URL`, `RETENTION_DAYS`,
     `ORPHAN_AGE_HOURS`, `CREDIT_EXPIRY_MONTHS`, `LOW_BALANCE_THRESHOLD`
5. Trigger a deploy
6. Once green, set `VITE_APP_URL` to the real production URL and
   re-deploy
7. Back in Supabase **Authentication → URL Configuration**, update the
   **Site URL** to match the production URL

## Step 6 — Promote yourself to admin

Sign up through the portal once (email or Google), then in the
Supabase SQL editor:

```sql
update profiles
  set role = 'admin',
      status = 'active'
  where email = 'you@firm.com';
```

Sign out and back in. The header now shows a teal **Admin** chip and you
can reach `/admin/jobs`, `/admin/jobs/:id`, and `/admin/clients`.

## Step 7 — End-to-end smoke test

Open two browser sessions (one regular, one Incognito) and sign up a
**client** account from the Incognito window — let's call them
"Acme Test". From the **admin** window:

1. Open `/admin/clients` → **Approve** Acme Test → **Grant** them 5
   credits (reason: `grant`)
2. From the client window, sign in again → dashboard shows 5 credits
3. Click **Upload a DPR** → pick a small PDF or XLSX → submit
4. Watch the per-file progress bar fill, then redirect to `/jobs/:id`
5. Back in the admin window, refresh `/admin/jobs` — the new job is
   listed at the top
6. Open it → upload a dummy PDF report + an MP3 → write a one-line
   summary → set status to **Completed** → leave "Email the client"
   checked → **Save & notify client**
7. The client's dashboard flips to **Completed** without refresh
   (realtime); the audio player appears and the Download report
   button works
8. If Resend is configured: the operator and client inboxes have
   both emails

If anything goes wrong, the audit log is the first place to look:

```sql
select created_at, user_id, action, metadata
  from audit_log
  order by id desc
  limit 30;
```

## Step 8 — Final cosmetic items

These are nice to have but don't block the smoke test:

- Replace `/public/auris-logo.svg` (currently a placeholder) with the
  real AURIS brand SVG, ideally a 1× PNG fallback too
- Drop the real mutual-NDA PDF at `/public/auris-nda-template.pdf` —
  the placeholder link in `/confidentiality` will 404 until it's there

---

## Cron jobs (Milestone 10) — verify after the smoke test

Netlify Scheduled Functions are picked up automatically once deployed.
The four schedules and their tunable env vars are listed in the
[README](../README.md#optional). Quick verification:

```bash
npx netlify functions:invoke cron-retention
npx netlify functions:invoke cron-orphan-reaper
npx netlify functions:invoke cron-credit-expiry
npx netlify functions:invoke cron-balance-reminders
```

Each returns a single summary line. Same payload lands in `audit_log`
with `action='cron_…'`. See **[RUNBOOK.md](RUNBOOK.md)** for the
detailed verification recipes (backdate a completed job to test
retention, insert a fake 13-month-old grant to test expiry, etc.).

---

## Troubleshooting first-deploy issues

**The dev server starts but every Supabase call fails silently.**
Either `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is unset. The
client is hard-wired to no-op in that case so the landing page still
works — but auth and data calls return `null`. Check
`/login` — it shows an explicit warning when Supabase isn't configured.

**The Google "Continue with Google" button bounces back to /login.**
The redirect URI registered in Google Cloud doesn't match the Supabase
callback URL. Re-check **step 3** — the redirect URI must be
`https://<project-ref>.supabase.co/auth/v1/callback` exactly, with
your project's ref.

**Sign-up succeeds but the profile row is missing.**
The `handle_new_user` trigger from `01_milestone2_auth.sql` didn't get
applied. Verify:

```sql
select trigger_name from information_schema.triggers
  where event_object_table = 'users' and event_object_schema = 'auth';
-- expected: on_auth_user_created
```

**Upload fails with `Method not allowed` or HTML responses.**
The Netlify Function isn't being routed. Confirm:
- `netlify.toml` is at the repo root
- The function file exports `export const config = { path: '/api/...' }`
- A site deploy has happened since the function was added

**`netlify functions:invoke` says the function doesn't exist.**
Run `npx netlify link` first to associate the local repo with the
deployed site.

**Storage uploads succeed but the path is missing from `dpr_jobs`.**
`confirm-upload` failed but the file already landed. Run
`/api/cancel-upload` from the browser console or wait for the orphan
reaper. The submission won't show up in the dashboard because we don't
list `submitted` jobs without a ledger row.

---

## Razorpay self-serve credit purchases (Milestone 12)

The `/pricing` page renders four credit packs (Starter / Small team /
Standard / Large firm). Clients click **Buy** → Razorpay Checkout opens
→ on success, the credit lands in their ledger automatically. The
operator doesn't have to do anything manual.

### Configure Razorpay

1. Sign up at <https://razorpay.com> and complete KYC (required for
   live payments; test mode works without)
2. In **Razorpay dashboard → Account & Settings → API Keys** → Generate
   Test/Live keys
   - **Key Id** → `RAZORPAY_KEY_ID`
   - **Key Secret** → `RAZORPAY_KEY_SECRET`
3. Configure the webhook:
   - **Webhooks → Add new webhook**
   - URL: `https://<your-netlify-domain>/api/razorpay/webhook`
   - Active events: **payment.captured**, **order.paid**
   - Generate a webhook secret → `RAZORPAY_WEBHOOK_SECRET`
4. Add all three values to Netlify → Site settings → Environment
   variables and re-deploy

### Adjust the pricing packs

Pricing lives in two mirrored files (kept in sync intentionally to
avoid a cross-tree import):

- `netlify/functions/_lib/packs.js` — server (authoritative for amounts)
- `src/lib/packs.js` — client (renders the cards)

Edit both, redeploy, done. The pack id is the join key (e.g.,
`standard`); Razorpay records it in the order notes.

### Smoke test

In Razorpay test mode, use the test card `4111 1111 1111 1111` with any
future expiry + any CVV + the OTP `1234`. Then:

- [ ] Sign in as an active client → `/pricing` → Buy the Standard pack
      (10 credits, ₹11,500)
- [ ] Razorpay Checkout opens → pay with the test card
- [ ] Modal closes; the dashboard shows the updated balance
- [ ] The client inbox has a receipt email subject
      `Receipt — 10 credits added · DPR Analyzer Pro`
- [ ] `credit_ledger` has a row `delta=+10, reason='razorpay_purchase'`
- [ ] `audit_log` has both
      `razorpay_order_created` and `razorpay_payment_applied` rows;
      the latter has `source='client_verify'`
- [ ] Repeat with the same payment id — webhook fires, sees the
      `razorpay_payment_applied` row, returns `alreadyApplied: true`
      without double-crediting

### Verifying webhook signature locally

`netlify dev` can simulate Razorpay webhooks if you forward them via a
tunnel like ngrok. Easier: invoke the function directly with a
hand-signed payload:

```bash
# Compute the signature for a sample event
node -e "
const c = require('node:crypto');
const body = JSON.stringify({
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_local_test',
        order_id: 'order_local_test',
        notes: { userId: 'YOUR-USER-UUID', packId: 'starter', credits: '1', priceInr: '1500' }
      }
    }
  }
});
console.log('SIG:', c.createHmac('sha256','YOUR_WEBHOOK_SECRET').update(body).digest('hex'));
console.log(body);
"
```

Then POST that body to `/api/razorpay/webhook` with header
`X-Razorpay-Signature: <SIG>`.
