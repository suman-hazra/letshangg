"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function saveVerdict(formData: FormData) {
  const preference_id = String(formData.get("preference_id") ?? "");
  const verdict = String(formData.get("verdict") ?? "");

  if (!preference_id || (verdict !== "yay" && verdict !== "nay")) {
    redirect("/onboarding/preferences");
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
        verdict: verdict as "yay" | "nay",
      },
      { onConflict: "user_id,preference_id" },
    );

  revalidatePath("/onboarding/preferences");
  redirect("/onboarding/preferences");
}
