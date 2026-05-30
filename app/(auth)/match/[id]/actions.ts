"use server";

import { createClient } from "@/lib/supabase/server";

export async function markSeen(hangId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: hang } = await supabase
    .from("hangs")
    .select("user_a, user_b, seen_a_at, seen_b_at")
    .eq("id", hangId)
    .maybeSingle();
  if (!hang) return;

  const now = new Date().toISOString();
  if (hang.user_a === user.id && !hang.seen_a_at) {
    await supabase.from("hangs").update({ seen_a_at: now }).eq("id", hangId);
  } else if (hang.user_b === user.id && !hang.seen_b_at) {
    await supabase.from("hangs").update({ seen_b_at: now }).eq("id", hangId);
  }
}
