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
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (Google OAuth) |
| Database | Supabase (Postgres) |
| Realtime | Supabase Realtime (in-app chat) |
| Language | TypeScript |
| Deployment | Vercel |

---

## Project Status

> 🚧 Early development — this is a portfolio project, actively being built.

- [ ] Supabase schema + seed data
- [ ] Auth & onboarding flow
- [ ] Preference swiping
- [ ] Friend requests
- [ ] Hang Manager (matching algorithm)
- [ ] Hang swiping UI
- [ ] Match screen
- [ ] In-app messaging

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project ([create one free](https://supabase.com))

### Installation

```bash
git clone https://github.com/yourusername/letshangg.git
cd letshangg
npm install
```

### Environment Variables

Create a `.env.local` file in the root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
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
