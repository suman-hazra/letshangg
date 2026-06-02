"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHangsForUser } from "@/lib/hang-manager";

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

export async function saveAvatarUrl(formData: FormData) {
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

  revalidatePath("/profile");
  revalidatePath("/home");
  revalidatePath("/friends");
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
