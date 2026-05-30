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

  // Has this user finished onboarding (profile + at least one preference)?
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  // No display_name = profile is a trigger-created stub, send to onboarding
  if (!profile?.display_name) {
    return NextResponse.redirect(`${origin}/onboarding/profile`);
  }

  const { count: prefCount } = await supabase
    .from("user_preferences")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (!prefCount || prefCount === 0) {
    return NextResponse.redirect(`${origin}/onboarding/preferences`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
