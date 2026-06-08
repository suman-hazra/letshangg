/**
 * Hang Manager.
 *
 * For a given user, finds each accepted friend, intersects their YAY preferences,
 * and inserts new `hangs` rows (capped at 2 per friend per run). Each row is
 * seeded with deterministic fallback copy from the pool, then upgraded to an
 * LLM-generated prompt if available.
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

export const MAX_HANGS_PER_FRIEND = 1;

/**
 * Pure function: given a user's YAY set, each friend's YAY set, and the
 * activity catalog, returns the per-friend list of preference ids to seed
 * (capped, deterministically ordered). No I/O — directly unit-testable.
 */
export type MatchInput = {
  userId: string;
  myYays: Set<string>;
  friendYays: Map<string, Set<string>>;          // friendId -> YAY pref ids
  myMehs?: Set<string>;
  friendMehs?: Map<string, Set<string>>;         // friendId -> MEH pref ids
  prefCatalog: Map<string, { id: string; activity_key: string }>;
  cap?: number;
};

export type MatchOutput = {
  friendId: string;
  user_a: string; // canonical (lex-smaller UUID)
  user_b: string;
  preferenceIds: string[]; // capped, sorted by activity_key
}[];

export function matchPreferences(input: MatchInput): MatchOutput {
  const cap = input.cap ?? MAX_HANGS_PER_FRIEND;
  const result: MatchOutput = [];

  for (const [friendId, friendSet] of input.friendYays) {
    // First try: shared YAYs (highest priority).
    let shared: { id: string; activity_key: string }[] = [];
    for (const prefId of input.myYays) {
      if (!friendSet.has(prefId)) continue;
      const cat = input.prefCatalog.get(prefId);
      if (cat) shared.push(cat);
    }

    // Fallback: shared MEHs when no YAY overlap exists.
    if (shared.length === 0 && input.myMehs && input.friendMehs) {
      const friendMehSet = input.friendMehs.get(friendId);
      if (friendMehSet) {
        for (const prefId of input.myMehs) {
          if (!friendMehSet.has(prefId)) continue;
          const cat = input.prefCatalog.get(prefId);
          if (cat) shared.push(cat);
        }
      }
    }

    if (shared.length === 0) continue;

    shared.sort((a, b) => a.activity_key.localeCompare(b.activity_key));
    const capped = shared.slice(0, cap);

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

type SeededHang = {
  id: string;
  user_a: string;
  user_b: string;
  preference_id: string;
  activity_label: string;
  friend_name: string;
};

export async function generateHangsForUser(userId: string): Promise<void> {
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

  // 2. Fetch profiles for friend display names.
  const { data: friendProfiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", friendIds);

  const profileById = new Map(
    (friendProfiles ?? []).map((p) => [
      p.id,
      p.display_name ?? p.username ?? "your friend",
    ]),
  );

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

  // 5. Fetch the activity catalog so we have labels + activity_key for copy.
  const sharedPrefIds = new Set<string>();
  for (const set of friendYaysById.values()) {
    for (const id of set) {
      if (myYaySet.has(id)) sharedPrefIds.add(id);
    }
  }
  for (const set of friendMehsById.values()) {
    for (const id of set) {
      if (myMehSet.has(id)) sharedPrefIds.add(id);
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

  // 8. Fire LLM polish in parallel for the newly inserted rows.
  const seededHangs: SeededHang[] = inserted.map((row) => {
    // Match back to candidateRow for friend_name + activity_label
    const cand = candidateRows.find(
      (c) =>
        c.user_a === row.user_a &&
        c.user_b === row.user_b &&
        c.preference_id === row.preference_id,
    )!;
    return {
      id: row.id,
      user_a: row.user_a,
      user_b: row.user_b,
      preference_id: row.preference_id,
      activity_label: cand.activity_label,
      friend_name: cand.friend_name,
    };
  });

  await Promise.allSettled(
    seededHangs.map(async (h) => {
      const polished = await generateWarmCopy(h.friend_name, h.activity_label);
      if (!polished) return;
      await admin
        .from("hangs")
        .update({ prompt_copy: polished })
        .eq("id", h.id);
    }),
  );
}
