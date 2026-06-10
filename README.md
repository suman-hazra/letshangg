# Letshangg 🤝

An AI matchmaker for hangouts. No awkward texts. No rejection. Just plans that actually happen.

---

## The Problem

Making plans is harder than it should be. You know people, but texting ten friends to find who's free is exhausting. And when you do reach out, there's always that quiet anxiety — what if they're busy, what if they don't want to hang, what if you get rejected? A few of those and you stop trying.

Letshangg takes that friction off your plate entirely.

## How It Works

1. **Onboard** — Sign in, set up your profile, and swipe through ~30 hangout types to build your preference profile (coffee runs, hikes, live shows, etc.)
2. **Add friends** — Connect with people you already know using their username
3. **Get matched** — The Hang Manager scores your overlapping preferences and surfaces the best hangout for each friend pair
4. **Swipe** — Right if you're in, left if you're not. When both people swipe right, it's a match
5. **Make it happen** — Chat inside the app to coordinate the details

Neither person knows who said no to what. You only see the mutual yeses.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16+ (App Router, React 19) |
| Styling | Tailwind CSS v4 |
| Auth | Supabase Auth (Google OAuth + anonymous) |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime (in-app chat) |
| Email | Resend |
| AI copy + events | OpenAI (warm hang prompts + live SF event search) |
| Analytics | PostHog |
| Error tracking | Sentry |
| Language | TypeScript |
| Deployment | Vercel |

---

## What's Shipped

The app is feature-complete and live at [letshangg.app](https://letshangg.app).

- [x] Supabase schema + seed data (10 migrations)
- [x] Google OAuth sign-in + anonymous demo sessions
- [x] Onboarding — profile setup + 30-activity preference quiz with images
- [x] Friend requests — username search + shareable invite links + QR codes
- [x] Hang Manager — scored preference-matching algorithm (see below)
- [x] Live event enrichment — real SF events attached to hang suggestions via OpenAI web search
- [x] Hang swiping UI — tap ✓/✕ cards on home feed
- [x] Match screen — moment screen with warm AI-generated copy, "Maybe later" escape
- [x] In-app chat — real-time match chat (Supabase Realtime) + direct friend messaging
- [x] Friended confirmation screen — moment screen after accepting a friend request
- [x] Invite accept flow — `/i/[username]` auto-creates friendship, routes through onboarding
- [x] Profile editing — avatar upload, display name, preference editing
- [x] Email notifications — friend requests and matches via Resend
- [x] Demo mode — full solo walkthrough with AI persona friends (see below)
- [x] Analytics + error tracking — PostHog + Sentry

---

## The Matching Algorithm

The Hang Manager runs server-side whenever the home feed is empty. It finds each accepted friend, scores every shared activity, and picks the best one per friend to surface.

### Scoring

Each (user, friend, activity) candidate gets a numeric score:

| Signal | Points |
|---|---|
| Mutual YAY | +300 |
| One YAY × one MEH | +200 |
| Mutual MEH | +100 |
| Either user previously left-swiped this activity | −150 each |
| Activity previously converted to a match for this user | +50 |
| SF-based pair + activity supports event search | +30 |
| Activity surfaced for this user recently (variety) | −20 |

Candidates dragged to ≤ 0 are dropped entirely. Within a score tier, ties break alphabetically by `activity_key` for determinism. The cap defaults to 1 hang per friend per run, but the demo mode raises it to 3.

### Stuck-pair fix

Previously the same alphabetically-first activity was proposed every run for a given pair — once the DB deduplicated it, the pair was frozen. Now, existing hangs for a pair are fetched before scoring and excluded from the candidate set, so a pair works through its whole shared catalog across successive runs.

### Queue ordering

The home feed ranks pending hangs before showing the top card:

1. **Friend already swiped right** (+100) — surfaces these first since they convert with a single swipe. Invisible to the user (no rejection shown either way).
2. **Event starting within 7 days** (+60) / **within 14 days** (+30) — timely event-backed cards surface earlier.
3. Ties resolve oldest-first.

### Event enrichment

For pairs where both users are in San Francisco, newly-seeded hang rows are enriched post-response via Next's `after()` — so it never blocks the page load. OpenAI's Responses API with the `web_search` tool searches across Eventbrite, Luma, Funcheap, DoTheBay and others for a real upcoming event matching the activity. Cards render immediately with hand-written fallback copy and quietly upgrade to event-backed copy on the next load.

---

## Demo Mode

A solo visitor can experience the complete product loop — profile setup, preference quiz, hang suggestions, a real match, and an in-app chat — without bringing a friend.

**How it works:**

Tapping "Try the demo" (landing or `/login`) creates an anonymous Supabase session and routes through the normal onboarding screens, prefilled for a one-tap continue. Three seeded persona accounts are auto-friended:

| Persona | Vibe | Strong YAYs |
|---|---|---|
| Maya | Cozy, low-key | Coffee, museums, bookstores, cooking, thrift |
| Dustin | Outdoorsy, active | Hiking, biking, climbing, beach, day trips |
| Priya | Social, spontaneous | Shows, drinks, dancing, festivals, escape rooms |

The personas' preference sets are deliberately spread across vibes so almost any quiz result overlaps with at least one of them.

After the quiz, hang cards appear immediately (enriched with SF events for matching activities in the background). When a visitor swipes right on a persona's hang, the persona "thinks" for 30 seconds and then swipes back — triggering the real match screen, the match email, and a chat where the persona replies in character using `gpt-4o-mini` (with canned fallbacks if `OPENAI_API_KEY` is absent).

Demo friends can be removed from the Profile → Account screen, which clears their friendships, hangs, and messages.

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

OPENAI_API_KEY=your_openai_key          # AI copy, event search, persona replies (optional — graceful fallbacks)
RESEND_API_KEY=your_resend_key          # friend request + match email notifications

NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn  # optional
SENTRY_AUTH_TOKEN=your_sentry_auth_token # optional
```

### Supabase Setup

1. Run all migrations in `supabase/migrations/` in order via the SQL editor or `supabase db push`
2. Run `supabase/seed.sql` to populate the activity catalog
3. Enable **Google OAuth** under Authentication → Providers
4. Enable **Anonymous sign-ins** under Authentication → Sign In / Up (required for demo mode)

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
