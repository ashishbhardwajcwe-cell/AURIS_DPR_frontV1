# Operator Setup Checklist

This is the live checklist for getting DPR Analyzer Pro running end to end.
It will grow as later milestones land. Tick items off in order.

## Milestone 1 — scaffold (this commit)

- [x] Repo scaffolded (Vite + React + Router)
- [x] AURIS-branded header & footer
- [x] Landing, Privacy, Confidentiality pages
- [x] Login stub (wires up in Milestone 2)
- [x] `netlify.toml` with SPA redirect
- [ ] `npm install && npm run dev` succeeds locally
- [ ] First Netlify deploy from this branch is green

## Milestone 2 — Supabase Auth (next)

- [ ] Create Supabase project in ap-south-1 (Mumbai)
- [ ] Enable email/password and Google OAuth providers
- [ ] Set Site URL + redirect URLs to the Netlify domain
- [ ] Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to Netlify env

## Milestone 3 — schema (after Milestone 2)

- [ ] Run the SQL migration from `/docs/sql/` in the Supabase SQL editor
- [ ] Verify RLS is enabled on every table
- [ ] Create `dpr-uploads` and `dpr-reports` storage buckets (private)
- [ ] Apply storage policies

## Misc

- [ ] Replace `/public/auris-logo.svg` placeholder with the real brand asset
- [ ] Drop a real mutual NDA PDF at `/public/auris-nda-template.pdf`
- [ ] Verify Resend sender domain
- [ ] Wire `OPERATOR_EMAIL` to the inbox that should receive new-upload alerts
