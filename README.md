# DPR Analyzer Pro — Client Portal

A secure, professional client portal for **DPR Analyzer Pro** (a product of
**AURIS**). Consultancy firms working on road and highway projects
(NHAI, MoRTH, PWD, BRO) upload Detailed Project Reports here and later
download a compliance report plus a podcast-style audio overview.

The portal is intentionally a thin **store-and-forward** application — it
moves raw bytes and tracks status. It does **not** parse, analyze, or
render the contents of uploaded files. All analysis happens externally
and is delivered back into the portal by a human operator.

## Status

**Feature-complete (Milestones 1–10).** Razorpay self-serve credit
purchases (Phase 2) are the only remaining brief item.

## Quick start

```bash
git clone <repo-url> dpr-portal && cd dpr-portal
npm install
cp .env.example .env        # fill in once Supabase is up
npm run dev                 # UI only, port 5173
# or:
npx netlify dev             # UI + functions on a single port (recommended)
```

For a fresh end-to-end deploy from scratch, follow **[docs/SETUP.md](docs/SETUP.md)**.
For day-2 operations (granting credits, manually invoking a cron, looking
up an audit trail), see **[docs/RUNBOOK.md](docs/RUNBOOK.md)**.

## Architecture in one diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      BROWSER (React + Vite)                     │
│  Landing · Auth · Dashboard · Upload · Job detail · Admin       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼────────────────────┐
          │               │                    │
          ▼               ▼                    ▼
   Direct upload    /api/* Netlify       Supabase Auth
   to signed URL    Functions (server)   (email + Google)
   (XHR or TUS)     ── service role ──┐
          │               │           │
          ▼               ▼           ▼
   ┌──────────────────────────────────────────┐
   │           Supabase (ap-south-1)          │
   │  Postgres + Storage + Realtime           │
   │   • profiles, dpr_jobs, credit_ledger,   │
   │     audit_log                            │
   │   • dpr-uploads / dpr-reports (private)  │
   └──────────────────────────────────────────┘
          ▲               ▲
          │               │
          │               └─── Resend (operator + client emails)
          │
          └─────── Netlify Scheduled Functions (cron)
                   retention · orphans · expiry · low-balance
```

## Tech stack

| Layer | Tool |
| --- | --- |
| UI | React 18 + Vite (JavaScript) + React Router |
| Backend-as-a-service | Supabase — Auth, Postgres, Storage, Realtime |
| Region | `ap-south-1` (Mumbai) for Indian data residency |
| Hosting | Netlify — static site + v2 ES-module Functions |
| Resumable uploads | `tus-js-client` for files > 50 MB |
| Transactional email | Resend |
| Optional automation | Make.com webhook |
| Future | Razorpay (Phase 2 — schema already supports it) |

## Project layout

```
src/
  components/      Shell (Header, Footer, Layout, AdminLayout),
                   primitives (Button, FormField, Alert, Modal),
                   feature widgets (StatusBadge, StatusTimeline,
                   JobsTable, CreditBalanceCard, FileDropzone,
                   UploadProgress, AudioPlayer, ReportDownloadCard,
                   DeliverableUploader, UploadsList, StatusFilter,
                   GoogleButton, AuthCard, ProtectedRoute,
                   EmptyState)
  pages/
    Landing.jsx, Login.jsx, SignUp.jsx, AuthCallback.jsx,
    CompleteProfile.jsx, Privacy.jsx, Confidentiality.jsx,
    Dashboard.jsx, Upload.jsx, JobDetail.jsx,
    AdminJobs.jsx, AdminJobDetail.jsx, AdminClients.jsx
  lib/
    supabase.js     browser client (anon key)
    auth.jsx        AuthProvider / useAuth context
    jobs.js         listJobsForUser, listAllJobs, subscribeToJob, …
    credits.js      getCreditBalance, getBalancesForUsers, …
    profiles.js     listAllProfiles, getProfile
    upload.js       requestUpload / confirmUpload / cancelUpload /
                    uploadFile (XHR + TUS dispatch)
    uploadLimits.js client-side mirror of server validation
    downloads.js    getDownloadUrl, downloadToBrowser
    admin.js        all four admin endpoints + deliverable upload
    format.js       formatDate, formatBytes, pluralize
  styles/
    theme.js        design tokens (colors, gradients, fonts, etc.)
    global.css      resets + Google Fonts

netlify/functions/
  _lib/             shared helpers (supabase, auth, response,
                    validation, email, templates, credit-fifo)
  request-upload.js, confirm-upload.js, cancel-upload.js,
  get-download-url.js, notify-completed.js
  admin/            save-job, upload-deliverable-url, grant-credits,
                    set-profile-status
  cron-retention.js, cron-orphan-reaper.js, cron-credit-expiry.js,
  cron-balance-reminders.js

public/             AURIS logo, NDA template placeholder
docs/
  SETUP.md          first-deploy guide
  RUNBOOK.md        day-2 operations
  sql/
    01_milestone2_auth.sql
    02_milestone3_schema.sql
netlify.toml        build + redirects + security headers
.env.example        every env var with safe defaults / placeholders
```

## Environment variables

Client-safe values are **prefixed `VITE_`** and ship in the browser
bundle; everything else is **server-only** and lives in Netlify Function
environments — never imported into the React code.

### Required

| Variable | Scope | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase anonymous key (RLS-bounded) |
| `VITE_APP_URL` | client + server | Public portal URL — used for email deep-links and OAuth redirects |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Privileged key — ledger writes, signed URLs, admin actions |

### Resend (email — recommended)

Functions degrade gracefully without these (single log line, no email sent).

| Variable | Scope | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | server | Resend API key |
| `RESEND_FROM_EMAIL` | server | Verified sender (e.g., `noreply@dpranalyzer.com`) |
| `OPERATOR_EMAIL` | server | Inbox for "new DPR submitted" alerts |

### Optional

| Variable | Default | Purpose |
| --- | --- | --- |
| `MAKE_WEBHOOK_URL` | — | Make.com automation webhook (per-submission payload) |
| `RETENTION_DAYS` | `30` | File retention window for closed jobs |
| `ORPHAN_AGE_HOURS` | `24` | Age before unconfirmed jobs get reaped |
| `CREDIT_EXPIRY_MONTHS` | `12` | Credit lifetime in the FIFO expiry cron |
| `LOW_BALANCE_THRESHOLD` | `3` | Balance at which reminder emails start |

## What is intentionally NOT here

These boundaries are deliberate and load-bearing:

- **No DPR analysis logic, scoring, or deficiency detection.**
- **No IRC / MoRTH reference files**, knowledge base, or rubrics.
- **No AI prompts** or calls to any LLM provider.
- **No copy of, link to, or import from the analysis engine repo.**
- **No in-browser parsing of uploaded files** — ever.

The portal is crash-proof against malformed spreadsheets (the "phantom
cells" problem that crashes Excel-parsing software) because nothing in
this codebase opens a workbook. Files stream from the browser into
storage as opaque bytes.

## Deploy

The site builds to `dist/` and deploys cleanly to Netlify. `netlify.toml`
configures:
- Build command (`npm run build`)
- Publish directory (`dist`)
- Functions directory (`netlify/functions`)
- Node 20 runtime
- `/api/*` → Functions redirect (safety net alongside v2 path config)
- SPA fallback for client-side routing
- Hardened security headers (X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, Permissions-Policy)

See **[docs/SETUP.md](docs/SETUP.md)** for the linear first-deploy walkthrough.
