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
    "{friend}'s been on a coffee tear — join them Saturday?",
    "Slow morning coffee with {friend}?",
    "{friend} for coffee, no agenda?",
    "Catch up over coffee with {friend}?",
  ],
  hike: [
    "Trail day with {friend}?",
    "{friend} and a hike — outside this weekend?",
    "Hike with {friend}, decide where on the way?",
    "Long walk, good talk — {friend} this weekend?",
    "{friend}'s been wanting to get outside. Saturday?",
    "Couple miles with {friend}?",
  ],
  drinks: [
    "Drinks with {friend} after work?",
    "{friend} and a Friday drink?",
    "Bar of {friend}'s choice this week?",
    "Catch up over drinks with {friend}?",
    "{friend} — one drink, no commitments?",
    "Slow drinks with {friend} somewhere quiet?",
  ],
  pizza: [
    "Pizza with {friend}, low effort?",
    "{friend} for a slice this week?",
    "{friend}'s been craving pizza — join them?",
    "Casual pizza with {friend}?",
    "{friend} and a pie?",
    "Pizza night with {friend}, no fuss?",
  ],
  museum: [
    "Museum afternoon with {friend}?",
    "{friend} for a slow museum wander?",
    "Hit a museum with {friend} this weekend?",
    "{friend} and an exhibit, then food?",
    "Museum date with {friend}, your pick?",
    "{friend} for some art this weekend?",
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
