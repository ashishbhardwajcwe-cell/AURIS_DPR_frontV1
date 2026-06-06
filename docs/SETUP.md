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

## Milestone 3 — full schema (next)

- [ ] Run the Milestone 3 SQL (`docs/sql/02_milestone3_schema.sql`) to
      create `credit_ledger`, `dpr_jobs`, `audit_log`, and storage buckets
- [ ] Create `dpr-uploads` and `dpr-reports` storage buckets (private)
- [ ] Apply storage RLS policies

## Misc

- [ ] Replace `/public/auris-logo.svg` placeholder with the real brand asset
- [ ] Drop a real mutual NDA PDF at `/public/auris-nda-template.pdf`
- [ ] Verify Resend sender domain (Milestone 8)
- [ ] Wire `OPERATOR_EMAIL` to the inbox that should receive new-upload
      alerts (Milestone 8)
