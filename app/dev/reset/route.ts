import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const { origin } = new URL(request.url);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Reset profile to blank onboarding state
  await supabase
    .from("profiles")
    .update({
      display_name: null,
      avatar_url: null,
      city: null,
      username: `user_${user.id.replace(/-/g, "").slice(0, 12)}`,
    })
    .eq("id", user.id);

  // Wipe preferences so the preferences step is fresh
  await supabase
    .from("user_preferences")
    .delete()
    .eq("user_id", user.id);

  // Wipe hangs so /home starts empty
  await supabase
    .from("hangs")
    .delete()
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

  return NextResponse.redirect(`${origin}/onboarding/profile`);
}
