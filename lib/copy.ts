/**
 * Warm copy generation for hang cards.
 *
 * Two layers, per the design review:
 * 1. `pickFallbackCopy()` — deterministic pool of hand-written prompts per activity.
 *    Always available. Used to seed the row immediately at hang creation.
 * 2. `generateWarmCopy()` — gpt-4o-mini polish. Updates the row if it succeeds;
 *    if not, the fallback stands. The hang is always renderable.
 *
 * Design constraints: short (<= 20 words), no emojis, no exclamation marks,
 * voice of a thoughtful friend, time hint "this weekend" or similar loose framing.
 */

import OpenAI from "openai";

// Each pool entry uses {friend} as a placeholder for the friend's display name.
// Keep these specific, warm, never corny. The whole product lives in this voice.
const FALLBACK_POOL: Record<string, string[]> = {
  coffee: [
    "Coffee, you two?",
    "Bottomless drip with {friend} this weekend?",
    "Pull up to coffee with {friend}?",
    "{friend} for coffee, no agenda?",
    "Slow morning coffee with {friend}?",
    "Catch up over coffee with {friend}?",
  ],
  restaurant: [
    "{friend} and a new restaurant this weekend?",
    "Try somewhere new with {friend}?",
    "{friend}, food adventure?",
    "Eat somewhere you'd both find — with {friend}?",
    "New spot with {friend} this week?",
  ],
  hike: [
    "Trail day with {friend}?",
    "{friend} and a hike — outside this weekend?",
    "Hike with {friend}, decide where on the way?",
    "Long walk, good talk — {friend} this weekend?",
    "Couple miles with {friend}?",
  ],
  show: [
    "Catch a show with {friend}?",
    "{friend} and live music this week?",
    "Whatever's playing — {friend}, in?",
    "Show night with {friend}?",
    "{friend} for a gig this weekend?",
  ],
  museum: [
    "Museum afternoon with {friend}?",
    "{friend} for a slow museum wander?",
    "Hit a museum with {friend} this weekend?",
    "{friend} and an exhibit, then food?",
    "{friend} for some art this weekend?",
  ],
  park: [
    "Park hang with {friend}?",
    "{friend} and a slow afternoon outside?",
    "Park, snacks, {friend} — this weekend?",
    "{friend} for a sit in the park?",
    "Park day with {friend}, no plan?",
  ],
  movie: [
    "Movie with {friend}, you pick?",
    "{friend} and whatever's showing?",
    "Theater night with {friend}?",
    "{friend}, popcorn, a movie?",
    "Catch a film with {friend} this week?",
  ],
  pizza: [
    "Pizza with {friend}, low effort?",
    "{friend} for a slice this week?",
    "{friend}'s been craving pizza — join them?",
    "Casual pizza with {friend}?",
    "Pizza night with {friend}, no fuss?",
  ],
  thrift: [
    "Thrift run with {friend}?",
    "{friend} for a thrift Saturday?",
    "Hit the racks with {friend}?",
    "{friend} and a vintage hunt?",
    "Thrift hop with {friend} this weekend?",
  ],
  workout: [
    "Class with {friend} this week?",
    "{friend} for a workout?",
    "Sweat with {friend}, your pick of class?",
    "Drag {friend} to a class with you?",
    "{friend} and a Saturday class?",
  ],
  drinks: [
    "Drinks with {friend} after work?",
    "{friend} and a Friday drink?",
    "Bar of {friend}'s choice this week?",
    "{friend} — one drink, no commitments?",
    "Slow drinks with {friend} somewhere quiet?",
  ],
  game_night: [
    "Game night with {friend}?",
    "{friend} and a board game?",
    "Bring a game, hang with {friend}?",
    "{friend}, cards or chess?",
    "{friend} for a game night this weekend?",
  ],
  bowling: [
    "Bowling with {friend}?",
    "{friend} for a lane this weekend?",
    "{friend}, bowling, no skill required?",
    "Throw some bad bowls with {friend}?",
    "{friend} and a few frames?",
  ],
  bike: [
    "Bike ride with {friend}?",
    "{friend} and a long ride this weekend?",
    "{friend} for a Saturday ride?",
    "Two-wheel hang with {friend}?",
    "Bike + coffee with {friend}?",
  ],
  sunset_walk: [
    "Sunset walk with {friend}?",
    "{friend} for golden hour outside?",
    "{friend}, walk, end with a view?",
    "Slow walk with {friend} at sunset?",
    "Catch the sunset with {friend}?",
  ],
  ice_cream: [
    "Ice cream run with {friend}?",
    "{friend}, cone, walk?",
    "{friend} and a scoop this weekend?",
    "Pull {friend} for ice cream?",
    "{friend}, dessert, your pick?",
  ],
  bookstore: [
    "Bookstore hour with {friend}?",
    "{friend} and a slow shelf browse?",
    "Bookstore + coffee with {friend}?",
    "{friend} for a paperback hunt?",
    "{friend} and the new releases this weekend?",
  ],
  karaoke: [
    "Karaoke with {friend}?",
    "{friend} and a Saturday mic?",
    "{friend}, songs, no judgment?",
    "Pull {friend} for karaoke?",
    "{friend}, your worst song, my best?",
  ],
  beach: [
    "Beach day with {friend}?",
    "{friend} for a waterfront afternoon?",
    "Sun and {friend} this weekend?",
    "{friend} and the boardwalk?",
    "Waterside hang with {friend}?",
  ],
  cooking: [
    "Cook with {friend} this week?",
    "{friend}, a recipe, a Saturday?",
    "Make dinner with {friend}?",
    "{friend} and one good meal at home?",
    "Kitchen hang with {friend}?",
  ],
};

const DEFAULT_FALLBACK = "{friend} for {activity} this weekend?";

export function pickFallbackCopy(
  activityKey: string,
  activityLabel: string,
  friendName: string,
): string {
  const pool = FALLBACK_POOL[activityKey] ?? [DEFAULT_FALLBACK];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  return pick
    .replaceAll("{friend}", friendName)
    .replaceAll("{activity}", activityLabel.toLowerCase());
}

/**
 * Calls gpt-4o-mini to write a single warm prompt.
 * Returns null on any failure or unusable output — the fallback stays.
 */
export async function generateWarmCopy(
  friendName: string,
  activityLabel: string,
): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Write one short, warm prompt (max 20 words) inviting ${friendName} to ${activityLabel.toLowerCase()}. Voice: a thoughtful friend, never corny. No emojis. No exclamation marks. Time hint: "this weekend" — don't be more specific. Output only the prompt itself, no quotes, no preamble.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 60,
    });

    const text = res.choices[0]?.message?.content?.trim();
    if (!text) return null;

    // Strip surrounding quotes the model sometimes adds
    const cleaned = text.replace(/^["“]|["”]$/g, "").trim();

    // Sanity: length and content checks
    if (cleaned.length < 8 || cleaned.length > 200) return null;
    if (cleaned.includes("!")) return null;
    // Reject if it's mostly emoji
    if (/^[\p{Emoji}\s]+$/u.test(cleaned)) return null;

    return cleaned;
  } catch {
    return null;
  }
}
