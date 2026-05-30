"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function swipeHang(formData: FormData) {
  const hangId = String(formData.get("hang_id") ?? "");
  const verdict = String(formData.get("verdict") ?? "");

  if (!hangId || (verdict !== "right" && verdict !== "left")) {
    redirect("/home");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Determine which column to write to.
  const { data: hang } = await supabase
    .from("hangs")
    .select("id, user_a, user_b, swipe_a, swipe_b")
    .eq("id", hangId)
    .maybeSingle();

  if (!hang) redirect("/home");

  const isUserA = hang.user_a === user.id;
  const isUserB = hang.user_b === user.id;
  if (!isUserA && !isUserB) redirect("/home");

  const otherSide = isUserA ? hang.swipe_b : hang.swipe_a;
  const matched = verdict === "right" && otherSide === "right";

  const update: {
    swipe_a?: "right" | "left";
    swipe_b?: "right" | "left";
    matched?: boolean;
  } = isUserA ? { swipe_a: verdict } : { swipe_b: verdict };
  if (matched) update.matched = true;

  await supabase.from("hangs").update(update).eq("id", hangId);

  revalidatePath("/home");

  if (matched) {
    redirect(`/match/${hangId}`);
  }
  redirect("/home");
}
