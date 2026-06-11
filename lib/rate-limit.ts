/**
 * Tiny in-memory fixed-window rate limiter.
 *
 * Best-effort only: on serverless each instance has its own memory and cold
 * starts reset it, so this slows naive scripted abuse against a warm instance
 * rather than guaranteeing a global limit. For hard guarantees (e.g. throttling
 * anonymous sign-ups across the fleet) use the provider's own controls —
 * Supabase Auth rate limits + CAPTCHA in the dashboard.
 *
 * Server-only. No dependencies.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 10_000;

export type RateLimitResult = { ok: boolean; retryAfterMs: number };

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    if (buckets.size >= MAX_TRACKED_KEYS) pruneExpired(now);
    buckets.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, retryAfterMs: 0 };
  }

  if (existing.count >= opts.limit) {
    return { ok: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { ok: true, retryAfterMs: existing.resetAt - now };
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
