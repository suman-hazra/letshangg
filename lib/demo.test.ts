import { describe, expect, it } from "vitest";
import { DEMO_SWIPE_BACK_DELAY_MS, isDemoSwipeBackDue } from "./demo";

const ME = "u-me";
const PERSONA = "u-persona";
const REAL_FRIEND = "u-real";
const DEMO_IDS = new Set([PERSONA]);

const NOW = new Date("2026-06-09T12:00:00Z");
const LONG_AGO = "2026-06-09T11:00:00Z"; // well past the delay
const JUST_NOW = new Date(
  NOW.getTime() - DEMO_SWIPE_BACK_DELAY_MS / 2,
).toISOString();

type Hang = Parameters<typeof isDemoSwipeBackDue>[0];

const baseHang = (overrides: Partial<Hang> = {}): Hang => ({
  user_a: ME,
  user_b: PERSONA,
  swipe_a: "right",
  swipe_b: null,
  swipe_a_at: LONG_AGO,
  swipe_b_at: null,
  matched: false,
  ...overrides,
});

describe("isDemoSwipeBackDue", () => {
  it("is due once the delay has passed", () => {
    expect(isDemoSwipeBackDue(baseHang(), ME, DEMO_IDS, NOW)).toBe(true);
  });

  it("is not due while the persona is still 'thinking'", () => {
    expect(
      isDemoSwipeBackDue(baseHang({ swipe_a_at: JUST_NOW }), ME, DEMO_IDS, NOW),
    ).toBe(false);
  });

  it("treats legacy rows without a swipe timestamp as due", () => {
    expect(
      isDemoSwipeBackDue(baseHang({ swipe_a_at: null }), ME, DEMO_IDS, NOW),
    ).toBe(true);
  });

  it("never fires for non-demo friends", () => {
    expect(
      isDemoSwipeBackDue(baseHang({ user_b: REAL_FRIEND }), ME, DEMO_IDS, NOW),
    ).toBe(false);
  });

  it("never fires on a left swipe", () => {
    expect(
      isDemoSwipeBackDue(baseHang({ swipe_a: "left" }), ME, DEMO_IDS, NOW),
    ).toBe(false);
  });

  it("never fires when the persona already swiped", () => {
    expect(
      isDemoSwipeBackDue(baseHang({ swipe_b: "right" }), ME, DEMO_IDS, NOW),
    ).toBe(false);
  });

  it("never fires on already-matched hangs", () => {
    expect(
      isDemoSwipeBackDue(baseHang({ matched: true }), ME, DEMO_IDS, NOW),
    ).toBe(false);
  });

  it("reads the correct columns when the user is user_b", () => {
    const hang = baseHang({
      user_a: PERSONA,
      user_b: ME,
      swipe_a: null,
      swipe_b: "right",
      swipe_a_at: null,
      swipe_b_at: LONG_AGO,
    });
    expect(isDemoSwipeBackDue(hang, ME, DEMO_IDS, NOW)).toBe(true);
  });

  it("returns false for hangs the user is not part of", () => {
    expect(
      isDemoSwipeBackDue(baseHang(), "u-someone-else", DEMO_IDS, NOW),
    ).toBe(false);
  });
});
