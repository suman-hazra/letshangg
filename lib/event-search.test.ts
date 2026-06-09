import { describe, expect, it } from "vitest";
import {
  buildEventSearchPrompt,
  isSupportedEventCity,
  parseLocalEventSuggestion,
} from "./event-search";

describe("buildEventSearchPrompt", () => {
  it("uses the SF event finder source strategy", () => {
    const prompt = buildEventSearchPrompt({
      today: "2026-06-09",
      activityLabel: "Try a new restaurant",
      friendName: "Priya",
      searchHint: "food festival",
    });

    expect(prompt).toContain("Partiful");
    expect(prompt).toContain("Eventbrite");
    expect(prompt).toContain("Luma");
    expect(prompt).toContain("Funcheap");
    expect(prompt).toContain("DoTheBay");
    expect(prompt).toContain("Filter out non-San Francisco venue events");
  });
});

describe("isSupportedEventCity", () => {
  it("accepts San Francisco variants for the first event-search rollout", () => {
    expect(isSupportedEventCity("San Francisco")).toBe(true);
    expect(isSupportedEventCity("SF")).toBe(true);
    expect(isSupportedEventCity("sf.")).toBe(true);
  });

  it("rejects unsupported or missing cities", () => {
    expect(isSupportedEventCity("Oakland")).toBe(false);
    expect(isSupportedEventCity(null)).toBe(false);
    expect(isSupportedEventCity("")).toBe(false);
  });
});

describe("parseLocalEventSuggestion", () => {
  it("accepts a valid event response", () => {
    const out = parseLocalEventSuggestion(
      JSON.stringify({
        has_event: true,
        title: "San Francisco Food Festival",
        url: "https://example.com/events/food-festival",
        venue: "Fort Mason",
        starts_at: "2026-06-20T19:00:00-07:00",
        source: "Example Events",
        prompt_copy: "Food festival with Priya this weekend?",
      }),
      new Date("2026-06-09T12:00:00Z"),
    );

    expect(out).toEqual({
      title: "San Francisco Food Festival",
      url: "https://example.com/events/food-festival",
      venue: "Fort Mason",
      startsAt: "2026-06-20T19:00:00-07:00",
      source: "Example Events",
      promptCopy: "Food festival with Priya this weekend?",
    });
  });

  it("rejects no-event, invalid-url, and shouty prompt responses", () => {
    expect(parseLocalEventSuggestion('{"has_event":false}')).toBeNull();
    expect(
      parseLocalEventSuggestion(
        JSON.stringify({
          has_event: true,
          title: "Bad URL Event",
          url: "javascript:alert(1)",
          venue: null,
          starts_at: null,
          source: null,
          prompt_copy: "Try this with Priya?",
        }),
      ),
    ).toBeNull();
    expect(
      parseLocalEventSuggestion(
        JSON.stringify({
          has_event: true,
          title: "Loud Event",
          url: "https://example.com",
          venue: null,
          starts_at: null,
          source: null,
          prompt_copy: "Go with Priya!",
        }),
      ),
    ).toBeNull();
  });

  it("rejects events outside the search window", () => {
    expect(
      parseLocalEventSuggestion(
        JSON.stringify({
          has_event: true,
          title: "Far Away Coffee Festival",
          url: "https://example.com/coffee",
          venue: "Fort Mason",
          starts_at: "2026-11-07T12:00:00-08:00",
          source: "Example Events",
          prompt_copy: "Coffee festival with Priya this weekend?",
        }),
        new Date("2026-06-09T12:00:00Z"),
      ),
    ).toBeNull();
  });
});
