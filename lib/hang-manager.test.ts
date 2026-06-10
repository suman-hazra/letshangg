import { describe, expect, it } from "vitest";
import { matchPreferences, rankPendingHangs } from "./hang-manager";

// Stable fake UUIDs (lexicographically: u-aaa < u-bbb < u-ccc < u-ddd).
const ME = "u-aaa";
const FRIEND_1 = "u-ccc";
const FRIEND_2 = "u-bbb"; // sorts BEFORE me — useful for canonical ordering test

const PREF = {
  COFFEE: { id: "p-coffee", activity_key: "coffee" },
  HIKE: { id: "p-hike", activity_key: "hike" },
  DRINKS: { id: "p-drinks", activity_key: "drinks" },
  PIZZA: { id: "p-pizza", activity_key: "pizza" },
  MUSEUM: { id: "p-museum", activity_key: "museum" },
};

const ALL_PREFS = new Map(Object.values(PREF).map((p) => [p.id, p]));

describe("matchPreferences", () => {
  it("happy path: 3 shared YAYs with 1 friend, capped at the default", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-hike", "p-drinks"]),
      friendYays: new Map([
        [FRIEND_1, new Set(["p-coffee", "p-hike", "p-drinks"])],
      ]),
      prefCatalog: ALL_PREFS,
    });

    expect(out).toHaveLength(1);
    expect(out[0].friendId).toBe(FRIEND_1);
    expect(out[0].preferenceIds).toHaveLength(1);
    // alphabetical by activity_key: coffee, drinks, hike -> take first
    expect(out[0].preferenceIds).toEqual(["p-coffee"]);
  });

  it("zero yay overlap falls back to shared mehs", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-hike"])]]),
      myMehs: new Set(["p-pizza", "p-drinks"]),
      friendMehs: new Map([[FRIEND_1, new Set(["p-pizza"])]]),
      prefCatalog: ALL_PREFS,
    });
    expect(out).toHaveLength(1);
    expect(out[0].preferenceIds).toEqual(["p-pizza"]);
  });

  it("yay overlap takes precedence over meh overlap", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
      myMehs: new Set(["p-pizza"]),
      friendMehs: new Map([[FRIEND_1, new Set(["p-pizza"])]]),
      prefCatalog: ALL_PREFS,
    });
    expect(out[0].preferenceIds).toEqual(["p-coffee"]);
  });

  it("zero overlap in both yay and meh returns no hangs", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-hike"])]]),
      myMehs: new Set(["p-pizza"]),
      friendMehs: new Map([[FRIEND_1, new Set(["p-drinks"])]]),
      prefCatalog: ALL_PREFS,
    });
    expect(out).toEqual([]);
  });

  it("canonical user_a/user_b: lex-smaller UUID is user_a", () => {
    // FRIEND_2 (u-bbb) < ME (u-aaa)? No — me=u-aaa < u-bbb. Let's verify both directions.
    const meSmaller = matchPreferences({
      userId: ME, // u-aaa
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
      prefCatalog: ALL_PREFS,
    });
    expect(meSmaller[0].user_a).toBe(ME);
    expect(meSmaller[0].user_b).toBe(FRIEND_1);

    // If FRIEND_2 calls it (u-bbb) with ME as a friend (u-aaa),
    // canonical user_a is still u-aaa.
    const friendCalls = matchPreferences({
      userId: FRIEND_2, // u-bbb
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[ME, new Set(["p-coffee"])]]),
      prefCatalog: ALL_PREFS,
    });
    expect(friendCalls[0].user_a).toBe(ME); // u-aaa < u-bbb
    expect(friendCalls[0].user_b).toBe(FRIEND_2);
  });

  it("multiple friends — each gets capped independently", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-hike", "p-pizza"]),
      friendYays: new Map([
        [FRIEND_1, new Set(["p-coffee", "p-hike", "p-pizza"])],
        [FRIEND_2, new Set(["p-coffee"])],
      ]),
      prefCatalog: ALL_PREFS,
    });

    expect(out).toHaveLength(2);
    const f1 = out.find((m) => m.friendId === FRIEND_1)!;
    const f2 = out.find((m) => m.friendId === FRIEND_2)!;
    expect(f1.preferenceIds).toEqual(["p-coffee"]);
    expect(f2.preferenceIds).toEqual(["p-coffee"]);
  });

  it("cap=1 produces at most 1 hang per friend", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-hike", "p-drinks"]),
      friendYays: new Map([
        [FRIEND_1, new Set(["p-coffee", "p-hike", "p-drinks"])],
      ]),
      prefCatalog: ALL_PREFS,
      cap: 1,
    });
    expect(out[0].preferenceIds).toEqual(["p-coffee"]); // alphabetical first
  });

  it("preferences missing from catalog are silently skipped (not crash)", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-unknown"]),
      friendYays: new Map([
        [FRIEND_1, new Set(["p-coffee", "p-unknown"])],
      ]),
      prefCatalog: ALL_PREFS, // does not contain p-unknown
    });
    expect(out[0].preferenceIds).toEqual(["p-coffee"]);
  });
});

describe("matchPreferences scoring", () => {
  it("excludes combos already tried with that friend (stuck-pair fix)", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-hike"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee", "p-hike"])]]),
      prefCatalog: ALL_PREFS,
      // coffee would win alphabetically, but a hang for it already exists.
      existingPairPrefs: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
    });
    expect(out[0].preferenceIds).toEqual(["p-hike"]);
  });

  it("returns nothing for a friend when every shared preference was tried", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
      prefCatalog: ALL_PREFS,
      existingPairPrefs: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
    });
    expect(out).toEqual([]);
  });

  it("cross yay/meh outranks mutual meh, even for a friend with no yays", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-hike"]),
      friendYays: new Map(), // friend has zero YAY rows
      myMehs: new Set(["p-pizza"]),
      friendMehs: new Map([[FRIEND_1, new Set(["p-hike", "p-pizza"])]]),
      prefCatalog: ALL_PREFS,
    });
    // my YAY × their MEH (hike) beats mutual MEH (pizza).
    expect(out).toHaveLength(1);
    expect(out[0].preferenceIds).toEqual(["p-hike"]);
  });

  it("a previously left-swiped activity loses to a clean alternative", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-hike"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee", "p-hike"])]]),
      prefCatalog: ALL_PREFS,
      myLeftSwipes: new Set(["p-coffee"]), // declined coffee with someone else
    });
    expect(out[0].preferenceIds).toEqual(["p-hike"]);
  });

  it("the friend's past left swipes demote an activity too", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-hike"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee", "p-hike"])]]),
      prefCatalog: ALL_PREFS,
      friendLeftSwipes: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
    });
    expect(out[0].preferenceIds).toEqual(["p-hike"]);
  });

  it("drops a candidate dragged to zero by left swipes from both users", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
      prefCatalog: ALL_PREFS,
      myLeftSwipes: new Set(["p-coffee"]),
      friendLeftSwipes: new Map([[FRIEND_1, new Set(["p-coffee"])]]),
    });
    expect(out).toEqual([]);
  });

  it("activities that previously converted to a match win ties", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-drinks", "p-hike"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-drinks", "p-hike"])]]),
      prefCatalog: ALL_PREFS,
      myMatchedPrefs: new Set(["p-hike"]), // drinks would win alphabetically
    });
    expect(out[0].preferenceIds).toEqual(["p-hike"]);
  });

  it("event-capable activities win ties for event-eligible friends", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-hike", "p-museum"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-hike", "p-museum"])]]),
      prefCatalog: ALL_PREFS,
      eventEligibleFriends: new Set([FRIEND_1]),
      eventCapablePrefs: new Set(["p-museum"]), // hike would win alphabetically
    });
    expect(out[0].preferenceIds).toEqual(["p-museum"]);
  });

  it("event boost only applies when the friend is event-eligible", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-hike", "p-museum"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-hike", "p-museum"])]]),
      prefCatalog: ALL_PREFS,
      eventEligibleFriends: new Set(), // not in SF
      eventCapablePrefs: new Set(["p-museum"]),
    });
    expect(out[0].preferenceIds).toEqual(["p-hike"]); // plain alphabetical tie
  });

  it("recently surfaced activities lose ties (variety)", () => {
    const out = matchPreferences({
      userId: ME,
      myYays: new Set(["p-coffee", "p-drinks"]),
      friendYays: new Map([[FRIEND_1, new Set(["p-coffee", "p-drinks"])]]),
      prefCatalog: ALL_PREFS,
      recentPrefIds: new Set(["p-coffee"]), // just suggested with another friend
    });
    expect(out[0].preferenceIds).toEqual(["p-drinks"]);
  });
});

describe("rankPendingHangs", () => {
  const NOW = new Date("2026-06-09T12:00:00Z");

  const baseHang = (overrides: Partial<Parameters<typeof rankPendingHangs>[0][number]> & { id: string }) => ({
    user_a: ME,
    swipe_a: null,
    swipe_b: null,
    event_starts_at: null,
    created_at: "2026-06-01T00:00:00Z",
    ...overrides,
  });

  it("surfaces hangs the friend already right-swiped first", () => {
    const ranked = rankPendingHangs(
      [
        baseHang({ id: "h-old", created_at: "2026-06-01T00:00:00Z" }),
        baseHang({
          id: "h-committed",
          created_at: "2026-06-05T00:00:00Z",
          swipe_b: "right", // friend (user_b) already swiped right
        }),
      ],
      ME,
      NOW,
    );
    expect(ranked.map((h) => h.id)).toEqual(["h-committed", "h-old"]);
  });

  it("reads the friend swipe from the correct column when I am user_b", () => {
    const ranked = rankPendingHangs(
      [
        baseHang({ id: "h-plain", user_a: FRIEND_1 }),
        baseHang({
          id: "h-committed",
          user_a: FRIEND_1,
          swipe_a: "right", // friend is user_a here
          created_at: "2026-06-05T00:00:00Z",
        }),
      ],
      ME,
      NOW,
    );
    expect(ranked.map((h) => h.id)).toEqual(["h-committed", "h-plain"]);
  });

  it("boosts imminent events, nearer events more", () => {
    const ranked = rankPendingHangs(
      [
        baseHang({ id: "h-no-event" }),
        baseHang({ id: "h-event-12d", event_starts_at: "2026-06-21T19:00:00Z" }),
        baseHang({ id: "h-event-3d", event_starts_at: "2026-06-12T19:00:00Z" }),
      ],
      ME,
      NOW,
    );
    expect(ranked.map((h) => h.id)).toEqual([
      "h-event-3d",
      "h-event-12d",
      "h-no-event",
    ]);
  });

  it("ignores events that already started or are too far out", () => {
    const ranked = rankPendingHangs(
      [
        baseHang({ id: "h-past", event_starts_at: "2026-06-08T19:00:00Z", created_at: "2026-06-02T00:00:00Z" }),
        baseHang({ id: "h-far", event_starts_at: "2026-08-01T19:00:00Z", created_at: "2026-06-03T00:00:00Z" }),
        baseHang({ id: "h-oldest", created_at: "2026-06-01T00:00:00Z" }),
      ],
      ME,
      NOW,
    );
    // No boosts apply — pure oldest-first.
    expect(ranked.map((h) => h.id)).toEqual(["h-oldest", "h-past", "h-far"]);
  });

  it("a friend right-swipe outranks an imminent event", () => {
    const ranked = rankPendingHangs(
      [
        baseHang({ id: "h-event", event_starts_at: "2026-06-11T19:00:00Z" }),
        baseHang({
          id: "h-committed",
          swipe_b: "right",
          created_at: "2026-06-08T00:00:00Z",
        }),
      ],
      ME,
      NOW,
    );
    expect(ranked.map((h) => h.id)).toEqual(["h-committed", "h-event"]);
  });

  it("ties resolve oldest-first", () => {
    const ranked = rankPendingHangs(
      [
        baseHang({ id: "h-newer", created_at: "2026-06-05T00:00:00Z" }),
        baseHang({ id: "h-older", created_at: "2026-06-01T00:00:00Z" }),
      ],
      ME,
      NOW,
    );
    expect(ranked.map((h) => h.id)).toEqual(["h-older", "h-newer"]);
  });
});
