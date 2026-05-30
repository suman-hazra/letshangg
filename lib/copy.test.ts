import { describe, expect, it } from "vitest";
import { pickFallbackCopy } from "./copy";

describe("pickFallbackCopy", () => {
  // Mirrors supabase/seed.sql. If we add/rename activity_keys, update both.
  const seededActivities = [
    "coffee", "restaurant", "hike", "show", "museum", "park", "movie",
    "pizza", "thrift", "workout", "drinks", "game_night", "bowling",
    "bike", "sunset_walk", "ice_cream", "bookstore", "karaoke", "beach",
    "cooking",
  ];

  it.each(seededActivities)(
    "returns a string for activity %s with friend interpolated",
    (activityKey) => {
      const out = pickFallbackCopy(activityKey, "Coffee", "Dustin");
      expect(out).toBeTypeOf("string");
      expect(out.length).toBeGreaterThan(0);
      // Either uses the friend name or the activity label.
      const usesFriendOrActivity =
        out.includes("Dustin") || /coffee/i.test(out);
      expect(usesFriendOrActivity).toBe(true);
    },
  );

  it("falls back to a generic template for unknown activity keys", () => {
    const out = pickFallbackCopy("yoga", "Yoga class", "Maya");
    expect(out).toBe("Maya for yoga class this weekend?");
  });

  it("never contains the {friend} placeholder after substitution", () => {
    for (const activityKey of seededActivities) {
      for (let i = 0; i < 50; i++) {
        const out = pickFallbackCopy(activityKey, "Coffee", "Dustin");
        expect(out).not.toContain("{friend}");
        expect(out).not.toContain("{activity}");
      }
    }
  });
});
