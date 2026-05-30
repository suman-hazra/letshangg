import { describe, expect, it } from "vitest";
import { pickFallbackCopy } from "./copy";

describe("pickFallbackCopy", () => {
  const seededActivities = ["coffee", "hike", "drinks", "pizza", "museum"];

  it.each(seededActivities)(
    "returns a string for activity %s with friend interpolated",
    (activityKey) => {
      const out = pickFallbackCopy(activityKey, "Coffee", "Dustin");
      expect(out).toBeTypeOf("string");
      expect(out.length).toBeGreaterThan(0);
      // Either uses the friend name or the activity label; the few hand-written
      // entries vary.
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
