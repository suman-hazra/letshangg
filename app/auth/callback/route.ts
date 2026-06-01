import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // If 'next' points to an invite link, let the user accept that first;
  // /i/[username] knows how to bounce them to onboarding afterwards.
  const nextIsInvite = next.startsWith("/i/");
  if (nextIsInvite) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Otherwise, route by onboarding state.
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.display_name) {
    return NextResponse.redirect(`${origin}/onboarding/profile`);
  }

  const [{ data: activePrefs }, { data: votedPrefs }] = await Promise.all([
    supabase
      .from("preference_options")
      .select("id")
      .eq("is_active", true),
    supabase
      .from("user_preferences")
      .select("preference_id")
      .eq("user_id", user.id),
  ]);

  const activePrefIds = new Set((activePrefs ?? []).map((p) => p.id));
  const votedActiveCount = (votedPrefs ?? []).filter((p) =>
    activePrefIds.has(p.preference_id),
  ).length;

  if (votedActiveCount < activePrefIds.size) {
    return NextResponse.redirect(`${origin}/onboarding/preferences-intro`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
