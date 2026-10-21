# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Imara** — an open-source mosque management platform. "Imara" means "developing, building and flourishing." The app handles prayer times display, Islamic donation processing (Zakat/Sadaqah/Waqf/Lillah), an AI chatbot, and an admin donation dashboard.

## Commands

```bash
npm run dev      # start dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

No test suite currently exists.

## Architecture

Next.js 16 App Router with all pages under `app/`. UI uses shadcn/ui components (`components/ui/`) with Tailwind CSS v4.

**Pages:**
- `/` — homepage (prayer times widget + donation form + chatbot)
- `/donate` — standalone donation page
- `/display` — full-screen prayer times for mosque TV display
- `/admin` — donation analytics dashboard (Recharts)
- `/donate/success` — Stripe redirect landing

**API Routes:**
- `POST /api/chat` — streaming LLM chatbot. Priority chain: Ollama (local, no key) → Claude API → demo mode (canned). Uses `@anthropic-ai/sdk` for Claude, raw fetch for Ollama.
- `GET /api/prayer-times` — proxies aladhan.com API, 1hr cache

**Key libraries:**
- `lib/supabase.ts` — exports `getSupabase()` (anon client) and `getSupabaseAdmin()` (service-role). Both return `null` when env vars are absent — all callers must guard.
- `lib/prayer-times.ts` — fetches from `api.aladhan.com` using mosque lat/lng env vars; includes `getNextPrayer()` helper
- `lib/stripe.ts` — exports `stripe` singleton
- `types/index.ts` — shared types (`Donor`, `PrayerTime`, `ChatMessage`) and `DONATION_CATEGORIES` constant

**Graceful degradation:** Supabase, Stripe, and the AI chatbot are all optional at runtime. The app boots and runs in demo mode without any API keys.

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required for full functionality:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_MOSQUE_NAME/LAT/LNG` | Mosque identity and location |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` + `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` | Payments |
| `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY` | Database |
| `ANTHROPIC_API_KEY` | Claude chatbot (or set `OLLAMA_ENABLED=true` + `OLLAMA_URL` + `OLLAMA_MODEL` for local) |
| `RESEND_API_KEY` + `RESEND_FROM_EMAIL` | Donation confirmation emails |
| `ADMIN_EMAIL` + `ADMIN_PASSWORD` | Admin dashboard access |

Run `lib/supabase-schema.sql` in Supabase SQL editor to initialize the database schema.

## Webhook Testing

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
