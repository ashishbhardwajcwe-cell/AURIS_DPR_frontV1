# DPR Analyzer Pro — Client Portal

A secure, professional client portal for **DPR Analyzer Pro** (a product of
**AURIS**). Consultancy firms working on road and highway projects (NHAI,
MoRTH, PWD, BRO) upload Detailed Project Reports here, and later download a
compliance report plus a podcast-style audio overview.

The portal is intentionally a thin **store-and-forward** application — it
moves raw bytes and tracks status. It does **not** parse, analyze, or render
the contents of uploaded files. All analysis happens externally and is
delivered back into the portal by a human operator.

## Status

Milestone 7 — real job detail page with status timeline (Submitted → In Review
→ Completed), inline `<audio>` player, "Download report (PDF)" button,
operator summary, and live status flips via realtime. Resend notifications
(Milestone 8) are next.

## Tech stack

- React 18 + Vite (JavaScript)
- React Router for client-side routing
- Supabase (Auth, Postgres, Storage) — wired in Milestone 2 onward
- Netlify (static hosting + Functions) — config in `netlify.toml`
- Resend (transactional email) — wired in Milestone 8
- Razorpay (credit-pack purchases) — Phase 2

## Local development

```bash
npm install
cp .env.example .env   # fill in values once Supabase is provisioned
npm run dev
```

Open <http://localhost:5173>.

## Environment variables

See `.env.example`. Client-safe values are prefixed `VITE_`; everything else
is server-only and lives in Netlify Function environments — never imported
into the React bundle.

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | client | Supabase anonymous key |
| `VITE_APP_URL` | client | Public URL of the portal (for email deep-links) |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Privileged key — credit ledger writes, signed URLs |
| `RESEND_API_KEY` | server | Transactional email |
| `RESEND_FROM_EMAIL` | server | Verified sender address |
| `OPERATOR_EMAIL` | server | Recipient of new-upload alerts |
| `MAKE_WEBHOOK_URL` | server | Optional: Make.com automation webhook |

## Project layout

```
src/
  components/      Header, Footer, Layout, FormField, Button, etc.
  pages/           Landing, Login, SignUp, AuthCallback, CompleteProfile,
                   Dashboard, Privacy, Confidentiality
  lib/             Supabase client + AuthProvider/useAuth
  styles/          theme.js design tokens + global.css
public/            Static assets (AURIS logo, NDA template, etc.)
netlify/functions/ (later) request-upload, confirm-upload, etc.
docs/              Operator-facing setup notes
  sql/             Versioned SQL migrations to paste into Supabase
```

## What is intentionally NOT here

- No DPR analysis logic, scoring, or deficiency detection.
- No IRC / MoRTH reference files, knowledge base, or rubrics.
- No AI prompts or calls to any LLM provider.
- No copy of, link to, or import from the analysis engine repo.
- No in-browser parsing of uploaded files — never.

These boundaries are deliberate. The portal is crash-proof against malformed
spreadsheets because nothing in this repo ever opens one.

## Deploy

The site builds to `dist/` and deploys cleanly to Netlify. The
`netlify.toml` sets the SPA redirect and points at `netlify/functions/`.
