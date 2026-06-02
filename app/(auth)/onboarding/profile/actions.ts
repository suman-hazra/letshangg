"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const AVATAR_MAX_BYTES = 2_000_000;
const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

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

export async function uploadOnboardingAvatar(formData: FormData) {
  const photo = formData.get("photo");
  if (!photo || typeof photo === "string") {
    return { error: "Choose a photo to upload." };
  }

  if (!Object.keys(AVATAR_MIME_TO_EXT).includes(photo.type)) {
    return { error: "Photo must be a JPG, PNG, or WebP." };
  }

  if (photo.size > AVATAR_MAX_BYTES) {
    return { error: "Photo must be under 2 MB." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Log in to upload a photo." };

  const admin = createAdminClient();
  const ext = AVATAR_MIME_TO_EXT[photo.type] ?? "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, photo, {
      cacheControl: "60",
      upsert: true,
      contentType: photo.type,
    });

  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  const avatar_url = `${data.publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await admin
    .from("profiles")
    .update({ avatar_url })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  return { url: avatar_url };
}
