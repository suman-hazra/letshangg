# Letshangg 🤝

An AI matchmaker for hangouts. No awkward texts. No rejection. Just plans that actually happen.

---

## The Problem

Making plans is harder than it should be. You know people, but texting ten friends to find who's free is exhausting. And when you do reach out, there's always that quiet anxiety — what if they're busy, what if they don't want to hang, what if you get rejected? A few of those and you stop trying.

Letshangg takes that friction off your plate entirely.

## How It Works

1. **Onboard** — Sign in, set up your profile, and swipe through ~20 hangout types to build your preference profile (coffee runs, hikes, live shows, etc.)
2. **Add friends** — Connect with people you already know using their username
3. **Get matched** — The Hang Manager compares your preferences with your friends' and surfaces hangouts you'd both enjoy
4. **Swipe** — Right if you're in, left if you're not. When both people swipe right, it's a match
5. **Make it happen** — Chat inside the app to coordinate the details

Neither person knows who said no to what. You only see the mutual yeses.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16+ (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime (in-app chat) |
| Email | Resend |
| AI copy | OpenAI (warm hang prompts) |
| Analytics | PostHog |
| Error tracking | Sentry |
| Language | TypeScript |
| Deployment | Vercel |

---

## What's Shipped

The app is feature-complete and live at [letshangg.app](https://letshangg.app).

- [x] Supabase schema + seed data (7 migrations)
- [x] Google OAuth sign-in
- [x] Onboarding — profile setup + 30-activity preference quiz with images
- [x] Friend requests — username search + shareable invite links + QR codes
- [x] Hang Manager — preference-intersection matching algorithm, 1 suggestion per friend pair
- [x] Hang swiping UI — tap ✓/✕ cards on home feed
- [x] Match screen — moment screen with warm AI-generated copy, "Maybe later" escape
- [x] In-app chat — real-time match chat (Supabase Realtime) + direct friend messaging
- [x] Friended confirmation screen — moment screen after accepting a friend request
- [x] Invite accept flow — `/i/[username]` auto-creates friendship, routes through onboarding
- [x] Profile editing — avatar upload, display name, preference editing
- [x] Email notifications — friend requests and matches via Resend
- [x] Analytics + error tracking — PostHog + Sentry

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([create one free](https://supabase.com))

### Installation

```bash
git clone https://github.com/suman-hazra/letshangg.git
cd letshangg
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

OPENAI_API_KEY=your_openai_key          # warm AI copy generation (optional — falls back to hand-written prompts)
RESEND_API_KEY=your_resend_key          # friend request + match email notifications

NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn  # optional
SENTRY_AUTH_TOKEN=your_sentry_auth_token # optional
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Design

Neutral-forward, minimal, and modern. Warm off-white base with a terracotta accent. Built mobile-first — the whole experience is designed for a 390px screen.

---

## License

MIT
