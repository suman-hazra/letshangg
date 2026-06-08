import { describe, expect, it } from "vitest";
import { matchPreferences } from "./hang-manager";

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
