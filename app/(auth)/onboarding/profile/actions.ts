"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function saveProfile(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim() || null;

  if (!USERNAME_RE.test(username)) {
    redirect(
      `/onboarding/profile?error=${encodeURIComponent(
        "username must be 3-20 letters, numbers, or underscores",
      )}`,
    );
  }

  if (!display_name) {
    redirect(
      `/onboarding/profile?error=${encodeURIComponent("display name required")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ username, display_name, city })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      redirect(
        `/onboarding/profile?error=${encodeURIComponent(
          `username "${username}" is taken — try another`,
        )}`,
      );
    }
    redirect(
      `/onboarding/profile?error=${encodeURIComponent(error.message)}`,
    );
  }

  redirect("/onboarding/preferences-intro");
}

export async function saveOnboardingAvatar(formData: FormData) {
  const avatar_url = String(formData.get("avatar_url") ?? "").trim();
  if (!avatar_url) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ avatar_url })
    .eq("id", user.id);
}
