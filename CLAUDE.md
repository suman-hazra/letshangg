# Letshangg — CLAUDE.md

## What This Is

Letshangg is a mobile web app (not a native app) that acts as an AI matchmaker for hangouts. It solves two problems: the inertia of making plans, and social anxiety around rejection. The app matches you with friends who share your hangout interests, so both parties have already said yes before any awkward texting happens.

This is a **portfolio project**. It should be fully functional but is not being commercialized. Prioritize clean code, real flows, and impressive UX over scale or production hardening.

---

## Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Backend/Auth/DB**: Supabase (Auth + Postgres + Realtime)
- **Language**: TypeScript
- **Deployment**: Vercel

---

## Design System

### Vibe
Youthful, modern, minimal, clean. **Not maximalist.** Neutral-forward palette with one warm accent. Think editorial meets social app — restrained but alive.

### Color Palette
```
--color-bg:         #F7F5F2    /* warm off-white base */
--color-surface:    #FFFFFF    /* cards, modals */
--color-border:     #E8E4DF    /* subtle dividers */
--color-text-primary:   #1A1714  /* near-black */
--color-text-secondary: #7A7570  /* muted gray */
--color-accent:     #E8855A    /* warm terracotta — the one pop of color */
--color-accent-light: #FBF0EB  /* accent tint for backgrounds */
--color-success:    #4CAF7D
--color-danger:     #E05A5A
```

### Typography
- **Display/Headings**: `DM Serif Display` — warm, editorial, a little personality
- **Body/UI**: `DM Sans` — clean, modern, pairs perfectly with the display font
- Both available via Google Fonts

### Interaction Pattern
- **No drag-to-swipe**. Use tap-based ✕ / ✓ buttons styled to feel decisive and satisfying
- Subtle card animations (scale, fade) on tap
- Mobile-first layout. Max content width ~430px centered on desktop

### Component Conventions
- Rounded cards: `rounded-2xl`
- Button radius: `rounded-full`
- Generous padding, lots of breathing room
- No drop shadows heavier than `shadow-sm`
- Accent color used sparingly — CTAs, active states, match moments

---

## Supabase Schema

### Tables

```sql
-- Users (extends Supabase auth.users)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  username text UNIQUE NOT NULL,
  display_name text,
  avatar_url text,
  age int,
  city text,
  created_at timestamptz DEFAULT now()
)

-- Hangout preference categories
preference_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,           -- e.g. "Grab coffee"
  emoji text,                    -- e.g. "☕"
  category text                  -- e.g. "food", "outdoors", "culture"
)

-- Per-user preferences: yay / nay
user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  preference_id uuid REFERENCES preference_options(id),
  verdict text CHECK (verdict IN ('yay', 'nay')),
  UNIQUE(user_id, preference_id)
)

-- Friend relationships (directional requests)
friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES profiles(id),
  addressee_id uuid REFERENCES profiles(id),
  status text CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
)

-- Generated hang suggestions
hangs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid REFERENCES profiles(id),
  user_b uuid REFERENCES profiles(id),
  preference_id uuid REFERENCES preference_options(id),  -- the shared activity
  swipe_a text CHECK (swipe_a IN ('right', 'left', null)),
  swipe_b text CHECK (swipe_b IN ('right', 'left', null)),
  matched boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- In-app messages (only unlocked after match)
messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hang_id uuid REFERENCES hangs(id),
  sender_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
)

-- Direct messages between accepted friends (no match required)
friendship_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid REFERENCES friendships(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at timestamptz DEFAULT now()
)
```

### Row Level Security
- `profiles`: readable by authenticated users, writable only by owner
- `user_preferences`: readable/writable only by owner
- `friendships`: readable by either party, writable by requester (create) or addressee (update status)
- `hangs`: readable by user_a or user_b only, writable by respective user (their swipe column)
- `messages`: readable/writable by sender or recipient of the hang
- `friendship_messages`: readable/writable by either party of the accepted friendship

---

## App Structure

```
/app
  /(auth)
    /login                    → Google OAuth sign-in
    /onboarding
      /profile                → username, display name, age, city, optional photo
      /preferences-intro      → intro screen before the quiz
      /preferences            → swipe through ~30 preference cards (yay/nay/meh)
  /(app)                      → protected routes, mobile shell layout
    /home                     → hang suggestions (swipe interface)
    /match/[id]               → match moment screen (no nav)
      /chat                   → real-time chat for a matched hang
    /friends
      /index                  → friend list + pending requests + matches section
      /add                    → search by username, send request
      /invite                 → shareable link + QR code
      /friended               → confirmation moment screen after accepting a request (no nav)
      /[friendshipId]/chat    → direct message chat between accepted friends
    /profile                  → your profile, edit preferences, sign out
      /preferences            → toggle YAY/NAY on activities

  /i/[username]               → invite-link landing (outside (app) layout)
```

---

## Core Flows

### 1. Onboarding
1. User signs in with Google via Supabase Auth
2. If no profile exists → redirect to `/onboarding/profile`
3. User fills: username (unique), display name, age, city, optional avatar upload
4. Redirect to `/onboarding/preferences`
5. Show 15–20 preference cards one at a time. Each card shows emoji + label + optional illustration
6. User taps YAY or NAY. Progress bar at top.
7. On completion → redirect to `/home`

### 2. Adding Friends
- Search by exact username
- Send friend request → creates `friendships` row with `status: pending`
- Other user sees pending request in `/friends` tab
- Accept → `status: accepted`
- Both users now see each other in their friend list

### 3. Hang Manager (Matching Algorithm)
Triggered: when a user completes onboarding OR when they open `/home` and their hangs are stale (>24h old or none exist)

**Algorithm:**
```
For each accepted friend of the current user:
  - Get current user's YAY preference IDs
  - Get friend's YAY preference IDs
  - Find intersection (shared YAYs)
  - For each shared preference, check if a hang already exists between this pair for this preference
  - If not → create a hang row (swipe_a and swipe_b both null)
  - Limit: max 1 new hang per friend per run (MAX_HANGS_PER_FRIEND = 1)
```

Surface at most 10 hangs at a time on `/home`.

### 4. Swiping on Hangs
- `/home` shows a stack of hang cards
- Each card shows: friend's name/avatar, the activity (emoji + label), a short prompt ("grab coffee with Melanie?")
- User taps ✓ → sets their swipe to `right`
- User taps ✕ → sets their swipe to `left`
- After both users have swiped right → set `matched: true` on the hang
- Trigger a match notification/screen moment

### 5. Matches & Messaging
- Matched hangs surface on the `/friends` tab in a "Matches" section at the top
- Tap a match → `/match/[id]` moment screen → "Open Conversation" → `/match/[id]/chat`
- Match chat uses the `messages` table; Supabase Realtime for live updates
- No read receipts needed for MVP

### 6. Direct Friend Messaging
- Every accepted friend row has a chat bubble icon → `/friends/[friendshipId]/chat`
- Uses the `friendship_messages` table; no match required
- Same Realtime + optimistic-update pattern as match chat

---

## Preference Options (Seed Data)

```
☕ Grab coffee
🍜 Try a new restaurant  
🥾 Go for a hike
🎵 Catch a live show
🎨 Visit a museum
🌳 Hang at the park
🎬 Watch a movie
🍕 Get pizza (casual, low-key)
🛍️ Go thrifting
🧘 Take a workout class together
🍹 Grab drinks
🎮 Game night
🎳 Bowling
🚴 Bike ride
🌅 Sunrise / sunset walk
🍦 Ice cream run
📚 Bookstore browse
🎤 Karaoke
🏖️ Beach / waterfront day
🍳 Cook a meal together
```

---

## Key UX Principles

1. **Zero friction to value**: User should see their first hang suggestions within 3 minutes of signing up
2. **No rejection visible**: Users never see who left-swiped them. Only mutual rights surface.
3. **Warm, encouraging copy**: Avoid cold/transactional language. "You and Dustin both love hiking 🥾" not "Match found."
4. **Mobile-first always**: Test everything at 390px width. No horizontal scroll. Touch targets ≥ 44px.

---

## What NOT to Build (MVP Scope)

- Push notifications (out of scope for mobile web MVP)
- Group hangs (only 1:1 for now)
- Discovery / meeting strangers (friends only)
- In-app photo sharing in messages
- Blocking / reporting (add later)
- Location-based features beyond city field

---

## Environment Variables Needed

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # for server-side Hang Manager + admin ops

OPENAI_API_KEY=                   # warm AI copy — optional, falls back to hand-written prompts
RESEND_API_KEY=                   # friend request + match email notifications

NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

NEXT_PUBLIC_SENTRY_DSN=           # optional
SENTRY_AUTH_TOKEN=                # optional
```

---

## Notes for Cowork

- Always use the App Router (`/app` directory), not Pages Router
- Use `@supabase/ssr` for server components and middleware auth
- The Hang Manager logic should live in a server action or API route, not client-side
- Seed `preference_options` table before testing — the app won't work without it
- Use `zustand` or React Context for lightweight client state (current user, swipe queue)
- All Supabase queries from server components where possible; use client only for Realtime (messages)

## Framework note

This project uses Next.js 16+ with React 19 and Tailwind v4 — see @AGENTS.md for the framework-version warning. Read `node_modules/next/dist/docs/` for current App Router conventions before writing code.
