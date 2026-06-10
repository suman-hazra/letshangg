"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHangsForUser } from "@/lib/hang-manager";
import { removeDemoFriendsForUser } from "@/lib/demo";

export async function saveDisplayName(formData: FormData) {
  const display_name = String(formData.get("display_name") ?? "").trim();
  if (!display_name) {
    redirect(
      `/profile?error=${encodeURIComponent("display name required")}`,
    );
  }
  if (display_name.length > 40) {
    redirect(
      `/profile?error=${encodeURIComponent("max 40 characters")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  redirect("/profile?saved=name");
}

const AVATAR_MAX_BYTES = 2_000_000;
const AVATAR_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadAvatar(formData: FormData) {
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

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/friends");

  return { url: avatar_url };
}

export async function removeDemoFriends() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await removeDemoFriendsForUser(user.id);

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/friends");
  redirect("/profile?saved=demo-removed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function deleteProfile(formData: FormData) {
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation !== "delete") {
    redirect(
      `/profile?error=${encodeURIComponent(
        "confirm profile deletion before continuing",
      )}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  const { data: avatarFiles } = await admin.storage
    .from("avatars")
    .list(user.id);
  if (avatarFiles && avatarFiles.length > 0) {
    await admin.storage
      .from("avatars")
      .remove(avatarFiles.map((file) => `${user.id}/${file.name}`));
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.auth.signOut();
  redirect("/");
}

export async function togglePreference(formData: FormData) {
  const preference_id = String(formData.get("preference_id") ?? "");
  const newVerdict = String(formData.get("new_verdict") ?? "");
  if (
    !preference_id ||
    (newVerdict !== "yay" && newVerdict !== "meh" && newVerdict !== "nay")
  ) {
    redirect("/profile/preferences");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("user_preferences")
    .upsert(
      {
        user_id: user.id,
        preference_id,
        verdict: newVerdict as "yay" | "meh" | "nay",
      },
      { onConflict: "user_id,preference_id" },
    );

  // Re-run matcher: a new YAY could surface previously-missing combinations.
  // Fire-and-forget within Vercel timeout limits (await for safety).
  if (newVerdict === "yay") {
    await generateHangsForUser(user.id).catch((e) =>
      console.error("matcher refresh failed", e),
    );
  }

  revalidatePath("/profile/preferences");
  revalidatePath("/home");
  redirect("/profile/preferences");
}
