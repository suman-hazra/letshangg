# Matching Algorithm

This document describes exactly how letshangg decides which hang suggestions to surface, in what order, and how it keeps suggestions fresh over time. Everything is in `lib/hang-manager.ts`; the pure scoring and ranking functions are fully unit-tested in `lib/hang-manager.test.ts`.

---

## Overview

Matching runs in two distinct phases:

1. **Generation** — deciding which (friend, activity) pairs to seed as hang rows
2. **Enrichment** — upgrading each seeded row's prompt copy with a live event or LLM-polished text

The two phases are deliberately decoupled. Generation is fast (DB queries only) and runs synchronously before the page renders. Enrichment is slow (external APIs) and runs _after_ the response is sent so it never blocks the user.

---

## Phase 1: Generation

`generateHangsForUser(userId)` — called when the home feed is empty, or when a user updates their preferences.

### Step 1 — Load inputs in parallel

Three queries fire simultaneously:

- **My profile** — city, for event eligibility
- **Friend profiles** — display names and cities
- **Full hang history** — all rows where either party is the current user or a friend, used to derive implicit-feedback signals (see Step 3)

Then two more queries (sequential, because they depend on friendships):

- **My preferences** — all YAY and MEH verdicts
- **Friends' preferences** — all YAY and MEH verdicts for every accepted friend, in one batch query

### Step 2 — Derive implicit-feedback signals from hang history

The hang history from Step 1 is scanned once to build five sets used by the scorer:

| Signal | How it's built |
|---|---|
| `existingPairPrefs` | Every `(friend, activity)` pair that already has a `hangs` row, regardless of swipe outcome |
| `myLeftSwipes` | Every `preference_id` where this user has swiped left, with _any_ friend |
| `friendLeftSwipes` | Every `preference_id` where a given friend has swiped left, with _anyone_ |
| `myMatchedPrefs` | Every `preference_id` that previously resulted in `matched = true` for this user |
| `recentPrefIds` | Every `preference_id` surfaced for this user in the last 14 days |

`existingPairPrefs` is the key one: candidates in this set are excluded _before_ scoring, so a pair is never offered the same activity twice regardless of how the algorithm would otherwise score it.

### Step 3 — Score every candidate

`matchPreferences(input)` — a pure function with no I/O, directly unit-testable.

For each accepted friend, every activity that overlaps in any way between the two users' preferences is considered. The base score comes from how strongly both users signalled interest:

| Verdict overlap | Base score |
|---|---|
| Both said YAY | 300 |
| One YAY, one MEH | 200 |
| Both said MEH | 100 |

Adjustments are then applied on top of the base:

| Adjustment | Amount | Condition |
|---|---|---|
| Left-swipe penalty | −150 | Applied once per user who has left-swiped this activity before (with anyone). Both users declining elsewhere → −300, almost certainly dropping the candidate below zero. |
| Match history boost | +50 | This activity converted to a match for the current user before |
| Event eligibility boost | +30 | Both users are in San Francisco AND the activity supports live event search |
| Recency variety penalty | −20 | This activity was surfaced for the current user in the last 14 days (with any friend) |

**Floor rule:** any candidate whose final score is ≤ 0 is dropped entirely. It is better to surface nothing for a friend than to suggest an activity both users have been avoiding.

**Already-tried exclusion:** candidates in `existingPairPrefs` for this friend are excluded before the loop runs. The cap (`MAX_HANGS_PER_FRIEND = 1`, raised to 3 in demo mode) is applied _after_ exclusion.

**Tie-breaking:** candidates with equal scores sort alphabetically by `activity_key`. This makes the selection deterministic across re-runs.

### Step 4 — Canonical pair ordering

Every hang row stores `user_a` and `user_b` where `user_a < user_b` lexicographically (UUID string comparison). This means a friendship between Alice and Bob maps to exactly one canonical row regardless of which user triggered generation.

### Step 5 — Idempotent insert

Candidate rows are upserted with `onConflict: "user_a,user_b,preference_id", ignoreDuplicates: true`. Duplicates are a no-op — re-running generation is safe.

Each row is immediately written with deterministic fallback copy from the hand-written pool in `lib/copy.ts`, so it is always renderable before enrichment runs.

---

## Phase 2: Enrichment

Enrichment runs via Next's `after()` — after the HTTP response has been sent. It never adds latency to a page load. If there is no request context (scripts, tests), it runs inline as a fallback.

For each newly inserted hang row, enrichment tries two upgrades in order:

### 2a — Live SF event search

Applies only when **both** users have city set to San Francisco (case-insensitive, normalised).

Uses OpenAI's Responses API with the `web_search` tool, pinned to San Francisco. The prompt searches across Eventbrite, Luma, Funcheap, DoTheBay, SF Station and others for one real upcoming public event matching the activity within the next 30 days.

The response is validated strictly before being accepted:

- `has_event` must be `true`
- Title must be at least 3 characters
- URL must be a valid `https://` or `http://` URL
- Event timing must fall within [−7 days, +30 days] of now (the −7 window allows for multi-day events that started recently)
- Prompt copy must be at least 8 characters with no exclamation marks

If the event passes validation, the hang row is updated with `event_title`, `event_url`, `event_venue`, `event_starts_at`, `event_source`, and new `prompt_copy` in the form _"[specific event invitation for this friend]"_.

If validation fails or no event is found, falls through to 2b.

### 2b — LLM copy polish

If no SF event was found (or the pair isn't SF-based), `generateWarmCopy()` calls `gpt-4o-mini` to produce a short, warm invite (<20 words, no emoji, no exclamation marks) for the specific friend and activity. If the API is unavailable, the hand-written fallback copy from Step 5 stands.

---

## Home feed queue ordering

`rankPendingHangs(rows, userId)` — called on every home page load to pick which card to show from the pending queue. Also a pure function with no I/O.

Scoring:

| Condition | Points |
|---|---|
| Friend has already swiped right on this hang | +100 |
| Event starts within 7 days | +60 |
| Event starts within 14 days | +30 |

**Why friend-already-swiped-right first?** A hang where only one person has swiped converts on a single tap instead of requiring two independent swipes. Ordering these first maximises the chance of a match without revealing any information to the user — no rejection is ever shown regardless of ordering.

**Tie-breaking:** oldest `created_at` first.

---

## Triggers

Generation runs in three places:

| Trigger | Location |
|---|---|
| Home feed is empty on page load | `app/(app)/home/page.tsx` |
| User swipes through all pending cards | `app/(app)/home/actions.ts` → `refreshHangs` |
| User adds a YAY to their preferences | `app/(app)/profile/actions.ts` → `togglePreference` |

The cap defaults to `MAX_HANGS_PER_FRIEND = 1` per run. Demo mode passes `capPerFriend: 3` to seed a fuller queue against the three personas.

---

## Database schema (relevant columns)

```sql
hangs (
  user_a          uuid,            -- lex-smaller of the two user UUIDs
  user_b          uuid,            -- lex-larger
  preference_id   uuid,
  prompt_copy     text,            -- fallback → LLM-polished → event-specific
  event_title     text,
  event_url       text,
  event_venue     text,
  event_starts_at timestamptz,
  event_source    text,
  swipe_a         text,            -- 'right' | 'left' | null
  swipe_b         text,
  swipe_a_at      timestamptz,     -- when user_a swiped (used for demo delay)
  swipe_b_at      timestamptz,
  matched         boolean,
  UNIQUE (user_a, user_b, preference_id)
)
```

The `UNIQUE` constraint on `(user_a, user_b, preference_id)` is the single source of truth for deduplication — the application-level `existingPairPrefs` exclusion is an optimisation that avoids wasted scoring work, not a replacement for this constraint.
