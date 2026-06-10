/**
 * Hang Manager.
 *
 * For a given user, finds each accepted friend, scores their overlapping
 * preferences, and inserts new `hangs` rows (capped at MAX_HANGS_PER_FRIEND
 * per friend per run). Each row is seeded with deterministic fallback copy
 * from the pool, then upgraded to an LLM-generated prompt if available.
 *
 * Selection is score-based, fed entirely by data we already collect:
 *   - verdict tier: mutual YAY > one YAY/one MEH > mutual MEH
 *   - past left swipes on an activity (by either user, with anyone) demote it
 *   - activities that previously converted to a match for this user get a boost
 *   - event-capable activities between two SF users get a boost
 *   - activities surfaced for this user recently get a small variety penalty
 *
 * Combos already tried with a friend (any existing hangs row for the pair +
 * preference) are excluded before capping, so a pair works through its whole
 * shared catalog over successive runs instead of re-proposing the same one.
 *
 * Invariants:
 *   - hangs(user_a, user_b, preference_id) is UNIQUE — duplicate inserts are
 *     caught by the DB and skipped (idempotent).
 *   - user_a < user_b (lexicographic UUID order) so a friendship in either
 *     direction maps to the same canonical row.
 *
 * Uses the service-role client to bypass RLS on insert. Server-only.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { generateWarmCopy, pickFallbackCopy } from "@/lib/copy";
import {
  canSearchEventsForActivity,
  findLocalEventSuggestion,
  isSupportedEventCity,
  type LocalEventSuggestion,
} from "@/lib/event-search";

export const MAX_HANGS_PER_FRIEND = 1;

/**
 * Scoring weights. Verdict tiers are spaced far apart so a single boost or
 * penalty reorders within a tier but rarely jumps one; the left-swipe penalty
 * is deliberately large enough to drop a candidate a full tier.
 */
const SCORE = {
  mutualYay: 300,
  crossYayMeh: 200,
  mutualMeh: 100,
  leftSwipePenalty: -150, // applied once per user who left-swiped the activity
  matchedBefore: 50,
  eventEligible: 30,
  recentlySurfaced: -20,
} as const;

const EMPTY_SET: ReadonlySet<string> = new Set();

/**
 * Pure function: given a user's preference verdicts, each friend's verdicts,
 * and implicit-feedback signals derived from hang history, returns the
 * per-friend list of preference ids to seed (scored, capped, deterministic).
 * No I/O — directly unit-testable.
 */
export type MatchInput = {
  userId: string;
  myYays: Set<string>;
  friendYays: Map<string, Set<string>>;          // friendId -> YAY pref ids
  myMehs?: Set<string>;
  friendMehs?: Map<string, Set<string>>;         // friendId -> MEH pref ids
  prefCatalog: Map<string, { id: string; activity_key: string }>;
  cap?: number;
  /** friendId -> pref ids already tried with that friend (any hangs row). Excluded before capping. */
  existingPairPrefs?: Map<string, Set<string>>;
  /** Pref ids this user has left-swiped before, with anyone. */
  myLeftSwipes?: Set<string>;
  /** friendId -> pref ids that friend has left-swiped before, with anyone. */
  friendLeftSwipes?: Map<string, Set<string>>;
  /** Pref ids that previously converted to a match for this user. */
  myMatchedPrefs?: Set<string>;
  /** Friends where both users are in a supported event city. */
  eventEligibleFriends?: Set<string>;
  /** Pref ids whose activity supports live event search. */
  eventCapablePrefs?: Set<string>;
  /** Pref ids surfaced for this user recently (variety penalty). */
  recentPrefIds?: Set<string>;
};

export type MatchOutput = {
  friendId: string;
  user_a: string; // canonical (lex-smaller UUID)
  user_b: string;
  preferenceIds: string[]; // capped, sorted by score desc then activity_key
}[];

export function matchPreferences(input: MatchInput): MatchOutput {
  const cap = input.cap ?? MAX_HANGS_PER_FRIEND;
  const result: MatchOutput = [];

  // Union of friend ids across both maps — a friend with only MEH rows still
  // gets considered.
  const friendIds = new Set([
    ...input.friendYays.keys(),
    ...(input.friendMehs?.keys() ?? []),
  ]);

  for (const friendId of friendIds) {
    const friendYaySet = input.friendYays.get(friendId) ?? EMPTY_SET;
    const friendMehSet = input.friendMehs?.get(friendId) ?? EMPTY_SET;
    const alreadyTried = input.existingPairPrefs?.get(friendId) ?? EMPTY_SET;
    const friendLefts = input.friendLeftSwipes?.get(friendId) ?? EMPTY_SET;
    const eventEligible = input.eventEligibleFriends?.has(friendId) ?? false;

    const candidates: { id: string; activity_key: string; score: number }[] =
      [];

    const consider = (prefId: string, tier: number) => {
      if (alreadyTried.has(prefId)) return;
      const cat = input.prefCatalog.get(prefId);
      if (!cat) return;

      let score = tier;
      if (input.myLeftSwipes?.has(prefId)) score += SCORE.leftSwipePenalty;
      if (friendLefts.has(prefId)) score += SCORE.leftSwipePenalty;
      if (input.myMatchedPrefs?.has(prefId)) score += SCORE.matchedBefore;
      if (eventEligible && input.eventCapablePrefs?.has(prefId)) {
        score += SCORE.eventEligible;
      }
      if (input.recentPrefIds?.has(prefId)) score += SCORE.recentlySurfaced;

      // A candidate dragged to zero or below (e.g. both users left-swiped it
      // elsewhere) is a worse bet than suggesting nothing.
      if (score <= 0) return;
      candidates.push({ id: cat.id, activity_key: cat.activity_key, score });
    };

    for (const prefId of input.myYays) {
      if (friendYaySet.has(prefId)) consider(prefId, SCORE.mutualYay);
      else if (friendMehSet.has(prefId)) consider(prefId, SCORE.crossYayMeh);
    }
    if (input.myMehs) {
      for (const prefId of input.myMehs) {
        if (friendYaySet.has(prefId)) consider(prefId, SCORE.crossYayMeh);
        else if (friendMehSet.has(prefId)) consider(prefId, SCORE.mutualMeh);
      }
    }

    if (candidates.length === 0) continue;

    candidates.sort(
      (a, b) =>
        b.score - a.score || a.activity_key.localeCompare(b.activity_key),
    );
    const capped = candidates.slice(0, cap);

    const [a, b] = [input.userId, friendId].sort();
    result.push({
      friendId,
      user_a: a,
      user_b: b,
      preferenceIds: capped.map((p) => p.id),
    });
  }

  return result;
}

/**
 * Orders a user's pending hang queue for /home. Hangs the friend has already
 * right-swiped surface first — they convert with a single swipe, and the
 * ordering reveals nothing (no rejection is ever shown either way). Hangs
 * tied to an imminent event come next. Ties resolve oldest-first.
 * Pure — directly unit-testable.
 */
export type PendingHangRow = {
  id: string;
  user_a: string;
  swipe_a: "right" | "left" | null;
  swipe_b: "right" | "left" | null;
  event_starts_at: string | null;
  created_at: string;
};

export function rankPendingHangs<T extends PendingHangRow>(
  rows: T[],
  userId: string,
  now: Date = new Date(),
): T[] {
  const nowMs = now.getTime();

  const scoreOf = (row: T): number => {
    let score = 0;
    const friendSwipe = row.user_a === userId ? row.swipe_b : row.swipe_a;
    if (friendSwipe === "right") score += 100;

    if (row.event_starts_at) {
      const startsMs = new Date(row.event_starts_at).getTime();
      if (!Number.isNaN(startsMs) && startsMs >= nowMs) {
        const days = (startsMs - nowMs) / 86_400_000;
        if (days <= 7) score += 60;
        else if (days <= 14) score += 30;
      }
    }
    return score;
  };

  return rows
    .map((row) => ({ row, score: scoreOf(row) }))
    .sort(
      (a, b) =>
        b.score - a.score || a.row.created_at.localeCompare(b.row.created_at),
    )
    .map((entry) => entry.row);
}

type SeededHang = {
  id: string;
  user_a: string;
  user_b: string;
  preference_id: string;
  activity_key: string;
  activity_label: string;
  friend_name: string;
};

export async function generateHangsForUser(
  userId: string,
  opts?: { capPerFriend?: number },
): Promise<void> {
  const admin = createAdminClient();

  // 1. Find all accepted friends (could be requester or addressee).
  const { data: friendships, error: fErr } = await admin
    .from("friendships")
    .select("requester_id, addressee_id")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (fErr || !friendships || friendships.length === 0) return;

  const friendIds = friendships.map((f) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id,
  );

  // 2. Fetch profiles (city-aware search, display names) and hang history
  //    (implicit-feedback signals) in parallel.
  const historyUserIds = [userId, ...friendIds].join(",");
  const [{ data: myProfile }, { data: friendProfiles }, { data: hangHistory }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, city")
        .eq("id", userId)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("id, display_name, username, city")
        .in("id", friendIds),
      admin
        .from("hangs")
        .select(
          "user_a, user_b, preference_id, swipe_a, swipe_b, matched, created_at",
        )
        .or(
          `user_a.in.(${historyUserIds}),user_b.in.(${historyUserIds})`,
        ),
    ]);

  const profileById = new Map(
    (friendProfiles ?? []).map((p) => [
      p.id,
      p.display_name ?? p.username ?? "your friend",
    ]),
  );
  const cityById = new Map((friendProfiles ?? []).map((p) => [p.id, p.city]));

  // Derive scoring signals from hang history:
  //   - existingPairPrefs: combos already tried with each friend (never re-seed)
  //   - left swipes: activities either party has declined before, with anyone
  //   - myMatchedPrefs: activities that previously converted to a match for me
  //   - recentPrefIds: activities surfaced for me in the last 14 days (variety)
  const friendIdSet = new Set(friendIds);
  const existingPairPrefs = new Map<string, Set<string>>();
  const myLeftSwipes = new Set<string>();
  const friendLeftSwipes = new Map<string, Set<string>>();
  const myMatchedPrefs = new Set<string>();
  const recentPrefIds = new Set<string>();
  const recentCutoffMs = Date.now() - 14 * 86_400_000;

  for (const h of hangHistory ?? []) {
    if (h.user_a === userId || h.user_b === userId) {
      const friendId = h.user_a === userId ? h.user_b : h.user_a;
      let pairSet = existingPairPrefs.get(friendId);
      if (!pairSet) {
        pairSet = new Set();
        existingPairPrefs.set(friendId, pairSet);
      }
      pairSet.add(h.preference_id);

      const mySwipe = h.user_a === userId ? h.swipe_a : h.swipe_b;
      if (mySwipe === "left") myLeftSwipes.add(h.preference_id);
      if (h.matched) myMatchedPrefs.add(h.preference_id);
      if (new Date(h.created_at).getTime() >= recentCutoffMs) {
        recentPrefIds.add(h.preference_id);
      }
    }

    // Friend left swipes count across all their hangs, not just ours.
    for (const [uid, swipe] of [
      [h.user_a, h.swipe_a],
      [h.user_b, h.swipe_b],
    ] as const) {
      if (swipe !== "left" || !friendIdSet.has(uid)) continue;
      let set = friendLeftSwipes.get(uid);
      if (!set) {
        set = new Set();
        friendLeftSwipes.set(uid, set);
      }
      set.add(h.preference_id);
    }
  }

  const eventEligibleFriends = new Set<string>();
  if (isSupportedEventCity(myProfile?.city)) {
    for (const fid of friendIds) {
      if (isSupportedEventCity(cityById.get(fid))) {
        eventEligibleFriends.add(fid);
      }
    }
  }

  // 3. Fetch this user's YAY and MEH preferences.
  const { data: myPrefs } = await admin
    .from("user_preferences")
    .select("preference_id, verdict")
    .eq("user_id", userId)
    .in("verdict", ["yay", "meh"]);

  const myYaySet = new Set<string>();
  const myMehSet = new Set<string>();
  for (const p of myPrefs ?? []) {
    if (p.verdict === "yay") myYaySet.add(p.preference_id);
    else myMehSet.add(p.preference_id);
  }
  if (myYaySet.size === 0 && myMehSet.size === 0) return;

  // 4. Fetch each friend's YAY and MEH preferences in one shot.
  const { data: friendPrefs } = await admin
    .from("user_preferences")
    .select("user_id, preference_id, verdict")
    .in("user_id", friendIds)
    .in("verdict", ["yay", "meh"]);

  const friendYaysById = new Map<string, Set<string>>();
  const friendMehsById = new Map<string, Set<string>>();
  for (const row of friendPrefs ?? []) {
    const map = row.verdict === "yay" ? friendYaysById : friendMehsById;
    if (!map.has(row.user_id)) {
      map.set(row.user_id, new Set());
    }
    map.get(row.user_id)!.add(row.preference_id);
  }

  // 5. Fetch the activity catalog for every potentially shared preference —
  //    mutual YAY, cross YAY/MEH, and mutual MEH are all candidates now.
  const myAllPrefs = new Set([...myYaySet, ...myMehSet]);
  const sharedPrefIds = new Set<string>();
  for (const map of [friendYaysById, friendMehsById]) {
    for (const set of map.values()) {
      for (const id of set) {
        if (myAllPrefs.has(id)) sharedPrefIds.add(id);
      }
    }
  }

  if (sharedPrefIds.size === 0) return;

  const { data: prefCatalog } = await admin
    .from("preference_options")
    .select("id, label, activity_key")
    .in("id", Array.from(sharedPrefIds))
    .eq("is_active", true);

  const prefById = new Map(
    (prefCatalog ?? []).map((p) => [p.id, p]),
  );

  const eventCapablePrefs = new Set<string>();
  for (const p of prefCatalog ?? []) {
    if (canSearchEventsForActivity(p.activity_key)) {
      eventCapablePrefs.add(p.id);
    }
  }

  // 6. Use the pure matchPreferences() function to compute per-friend hang seeds.
  const matches = matchPreferences({
    userId,
    myYays: myYaySet,
    friendYays: friendYaysById,
    myMehs: myMehSet,
    friendMehs: friendMehsById,
    prefCatalog: new Map(
      Array.from(prefById.entries()).map(([id, p]) => [
        id,
        { id: p.id, activity_key: p.activity_key },
      ]),
    ),
    existingPairPrefs,
    myLeftSwipes,
    friendLeftSwipes,
    myMatchedPrefs,
    eventEligibleFriends,
    eventCapablePrefs,
    recentPrefIds,
    cap: opts?.capPerFriend,
  });

  // Hydrate with prompt copy + names for insert.
  const candidateRows: {
    user_a: string;
    user_b: string;
    preference_id: string;
    prompt_copy: string;
    activity_label: string;
    activity_key: string;
    friend_name: string;
  }[] = [];

  for (const m of matches) {
    const friendName = profileById.get(m.friendId) ?? "your friend";
    for (const prefId of m.preferenceIds) {
      const pref = prefById.get(prefId)!;
      candidateRows.push({
        user_a: m.user_a,
        user_b: m.user_b,
        preference_id: pref.id,
        prompt_copy: pickFallbackCopy(pref.activity_key, pref.label, friendName),
        activity_label: pref.label,
        activity_key: pref.activity_key,
        friend_name: friendName,
      });
    }
  }

  if (candidateRows.length === 0) return;

  // 7. Insert with onConflict (idempotent thanks to the UNIQUE constraint).
  //    We don't error-out on duplicates; they're expected on re-runs.
  const { data: inserted } = await admin
    .from("hangs")
    .upsert(
      candidateRows.map((c) => ({
          user_a: c.user_a,
          user_b: c.user_b,
          preference_id: c.preference_id,
        prompt_copy: c.prompt_copy,
      })),
      {
        onConflict: "user_a,user_b,preference_id",
        ignoreDuplicates: true,
      },
    )
    .select("id, user_a, user_b, preference_id");

  if (!inserted || inserted.length === 0) return;

  const seededHangs: SeededHang[] = inserted.map((row) => {
    // Match back to candidateRow for friend_name + activity_label.
    const candidateIndex = candidateRows.findIndex(
      (c) =>
        c.user_a === row.user_a &&
        c.user_b === row.user_b &&
        c.preference_id === row.preference_id,
    );
    const cand = candidateRows[candidateIndex]!;
    return {
      id: row.id,
      user_a: row.user_a,
      user_b: row.user_b,
      preference_id: row.preference_id,
      activity_key: cand.activity_key,
      activity_label: cand.activity_label,
      friend_name: cand.friend_name,
    };
  });

  // 8. Enrich newly inserted rows: current SF event first, generic LLM copy
  //    second. Scheduled after the response is sent — live event search can
  //    take 10s+ per hang and must never block the page load that triggered
  //    generation. Cards render immediately with their fallback copy and
  //    upgrade in place on a later load.
  await scheduleAfterResponse(async () => {
    await Promise.allSettled(
      seededHangs.map(async (h) => {
        const eventSuggestion = await findEventForSeededHang({
          hang: h,
          userId,
          myCity: myProfile?.city,
          cityById,
        });

        if (eventSuggestion) {
          await admin
            .from("hangs")
            .update({
              prompt_copy: eventSuggestion.promptCopy,
              event_title: eventSuggestion.title,
              event_url: eventSuggestion.url,
              event_venue: eventSuggestion.venue,
              event_starts_at: eventSuggestion.startsAt,
              event_source: eventSuggestion.source,
            })
            .eq("id", h.id);
          return;
        }

        const polished = await generateWarmCopy(h.friend_name, h.activity_label);
        if (!polished) return;
        await admin
          .from("hangs")
          .update({ prompt_copy: polished })
          .eq("id", h.id);
      }),
    );
  });
}

/**
 * Runs `task` after the current response is sent (Next's `after()`), so slow
 * enrichment never blocks a page or action. Falls back to running inline when
 * there's no request context (tests, scripts). Dynamic import keeps
 * `next/server` out of the module graph for unit tests of the pure functions.
 */
async function scheduleAfterResponse(task: () => Promise<void>): Promise<void> {
  try {
    const { after } = await import("next/server");
    after(task);
  } catch {
    await task();
  }
}

async function findEventForSeededHang(args: {
  hang: SeededHang;
  userId: string;
  myCity: string | null | undefined;
  cityById: Map<string, string | null>;
}): Promise<LocalEventSuggestion | null> {
  const friendId =
    args.hang.user_a === args.userId ? args.hang.user_b : args.hang.user_a;
  const friendCity = args.cityById.get(friendId);
  if (
    !isSupportedEventCity(args.myCity) ||
    !isSupportedEventCity(friendCity)
  ) {
    return null;
  }

  return findLocalEventSuggestion({
    city: "San Francisco",
    friendName: args.hang.friend_name,
    activityKey: args.hang.activity_key,
    activityLabel: args.hang.activity_label,
  });
}
