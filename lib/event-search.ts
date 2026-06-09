/**
 * Real-time event enrichment for hang suggestions.
 *
 * This is intentionally narrow for the first rollout: San Francisco only,
 * server-side only, and non-blocking. If search fails or returns a weak result,
 * callers keep the normal fallback hang copy.
 */

import OpenAI from "openai";

const SUPPORTED_CITY = "San Francisco";
const DEFAULT_MODEL = process.env.OPENAI_EVENT_SEARCH_MODEL ?? "gpt-4.1-mini";

const ACTIVITY_SEARCH_HINTS: Record<string, string> = {
  restaurant: "food festival, restaurant week, tasting event, night market, pop-up food event",
  pizza: "pizza festival, food festival, slice pop-up, Italian food event",
  drinks: "cocktail event, beer festival, wine tasting, bar crawl",
  coffee: "coffee festival, cafe pop-up, coffee tasting",
  show: "live music show, concert, performance",
  theater_comedy: "comedy show, theater performance",
  museum: "museum exhibit, gallery event, art opening",
  festival: "festival, street fair, neighborhood festival",
  pottery_class: "pottery class, art workshop",
  cooking: "cooking class, food workshop",
};

const SF_EVENT_SOURCES = [
  "Partiful SF explore",
  "Eventbrite San Francisco events",
  "Luma SF",
  "SeatGeek SF",
  "SF Station events",
  "Funcheap SF",
  "Downtown SF events",
  "DoTheBay SF events and top picks",
];

export type LocalEventSuggestion = {
  title: string;
  url: string;
  venue: string | null;
  startsAt: string | null;
  source: string | null;
  promptCopy: string;
};

type RawEventResponse = {
  has_event?: unknown;
  title?: unknown;
  url?: unknown;
  venue?: unknown;
  starts_at?: unknown;
  source?: unknown;
  prompt_copy?: unknown;
};

export function isSupportedEventCity(city: string | null | undefined): boolean {
  if (!city) return false;
  const normalized = city.trim().toLowerCase().replace(/[.,]/g, "");
  return normalized === "san francisco" || normalized === "sf";
}

export function canSearchEventsForActivity(activityKey: string): boolean {
  return activityKey in ACTIVITY_SEARCH_HINTS;
}

export async function findLocalEventSuggestion(args: {
  city: string;
  friendName: string;
  activityKey: string;
  activityLabel: string;
  now?: Date;
}): Promise<LocalEventSuggestion | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!isSupportedEventCity(args.city)) return null;

  const searchHint = ACTIVITY_SEARCH_HINTS[args.activityKey];
  if (!searchHint) return null;

  const now = args.now ?? new Date();
  const today = now.toISOString().slice(0, 10);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const inputText = buildEventSearchPrompt({
    today,
    activityLabel: args.activityLabel,
    friendName: args.friendName,
    searchHint,
  });

  try {
    const response = await client.responses.create({
      model: DEFAULT_MODEL,
      tools: [
        {
          type: "web_search",
          search_context_size: "low",
          user_location: {
            type: "approximate",
            city: SUPPORTED_CITY,
            region: "California",
            country: "US",
            timezone: "America/Los_Angeles",
          },
        },
      ],
      tool_choice: "required",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: inputText,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "local_event_suggestion",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              has_event: { type: "boolean" },
              title: { type: ["string", "null"] },
              url: { type: ["string", "null"] },
              venue: { type: ["string", "null"] },
              starts_at: {
                type: ["string", "null"],
                description: "ISO 8601 date/time if available, otherwise null.",
              },
              source: { type: ["string", "null"] },
              prompt_copy: { type: ["string", "null"] },
            },
            required: [
              "has_event",
              "title",
              "url",
              "venue",
              "starts_at",
              "source",
              "prompt_copy",
            ],
          },
        },
      },
      max_output_tokens: 350,
    });

    return parseLocalEventSuggestion(response.output_text, now);
  } catch (error) {
    console.error("event search failed", error);
    return null;
  }
}

export function buildEventSearchPrompt(args: {
  today: string;
  activityLabel: string;
  friendName: string;
  searchHint: string;
}): string {
  return [
    `Today is ${args.today}.`,
    `Find one real upcoming public event in ${SUPPORTED_CITY} in the next 30 days that fits "${args.activityLabel}".`,
    `Search intent: ${args.searchHint}.`,
    `Search across these SF event sources when relevant: ${SF_EVENT_SOURCES.join(", ")}.`,
    "Prefer official event pages, venue pages, ticketing pages, or reputable local listings.",
    "Prioritize events confirmed by more than one source, but return the best single source URL.",
    "Filter out non-San Francisco venue events.",
    "Do not invent events. If no specific upcoming event is found, return has_event false.",
    `If found, write prompt_copy as one short invitation to ${args.friendName}, max 20 words, no emoji, no exclamation mark.`,
  ].join(" ");
}

export function parseLocalEventSuggestion(
  text: string | null | undefined,
  now = new Date(),
): LocalEventSuggestion | null {
  if (!text) return null;

  let raw: RawEventResponse;
  try {
    raw = JSON.parse(text) as RawEventResponse;
  } catch {
    return null;
  }

  if (raw.has_event !== true) return null;
  if (typeof raw.title !== "string" || raw.title.trim().length < 3) return null;
  if (typeof raw.url !== "string" || !isSafeHttpUrl(raw.url)) return null;
  if (!hasRelevantEventTiming(raw.starts_at, now)) return null;
  if (
    typeof raw.prompt_copy !== "string" ||
    raw.prompt_copy.trim().length < 8 ||
    raw.prompt_copy.includes("!")
  ) {
    return null;
  }

  return {
    title: raw.title.trim(),
    url: raw.url.trim(),
    venue: nullableString(raw.venue),
    startsAt: nullableString(raw.starts_at),
    source: nullableString(raw.source),
    promptCopy: raw.prompt_copy.trim().replace(/^["“]|["”]$/g, ""),
  };
}

function hasRelevantEventTiming(value: unknown, now: Date): boolean {
  if (typeof value !== "string" || !value.trim()) return true;

  const startsAt = new Date(value);
  if (Number.isNaN(startsAt.getTime())) return false;

  const earliest = new Date(now);
  earliest.setUTCDate(earliest.getUTCDate() - 7);
  earliest.setUTCHours(0, 0, 0, 0);

  const latest = new Date(now);
  latest.setUTCDate(latest.getUTCDate() + 30);
  latest.setUTCHours(23, 59, 59, 999);

  return startsAt >= earliest && startsAt <= latest;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}
