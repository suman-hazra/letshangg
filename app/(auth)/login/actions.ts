"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addDemoFriendsForUser } from "@/lib/demo";
import { rateLimit } from "@/lib/rate-limit";

export async function signInWithGoogle(formData: FormData) {
  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL!;

  const next = String(formData.get("next") ?? "");
  const callback = new URL(`${origin}/auth/callback`);
  if (next && next.startsWith("/")) {
    callback.searchParams.set("next", next);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callback.toString(),
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data?.url) {
    redirect(data.url);
  }
}

/**
 * One-tap demo: anonymous Supabase session and instant demo friends — so a
 * visitor experiences the full loop (profile → quiz → hangs → match → chat)
 * without Google OAuth. The profile screen stays in the flow but arrives
 * prefilled, so it's a single "Continue" tap. SF city prefill makes
 * event-backed suggestions eligible.
 * Requires "Allow anonymous sign-ins" in the Supabase dashboard.
 */
export async function signInAsDemo() {
  // Throttle scripted abuse: each demo session mints an anonymous auth user and
  // seeds hangs. Best-effort per-IP cap (see lib/rate-limit.ts caveats); the
  // durable backstop is Supabase Auth's anonymous sign-in rate limit + CAPTCHA.
  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { ok } = rateLimit(`demo:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!ok) {
    redirect(
      `/login?error=${encodeURIComponent(
        "Too many demo sessions from here — give it a minute and try again.",
      )}`,
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error || !data.user) {
    redirect(
      `/login?error=${encodeURIComponent(
        "The demo is taking a breather — try signing in with Google instead.",
      )}`,
    );
  }

  await addDemoFriendsForUser(data.user.id).catch((e) =>
    console.error("demo friends setup failed", e),
  );

  // Don't write display_name here — the profile page treats a set
  // display_name as "already onboarded" and would skip the screen.
  const prefill = new URLSearchParams({
    username: `guest_${Math.random().toString(36).slice(2, 8)}`,
    display_name: "Guest",
    city: "San Francisco",
  });
  redirect(`/onboarding/profile?${prefill.toString()}`);
}
