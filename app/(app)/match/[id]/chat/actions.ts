"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const hangId = String(formData.get("hang_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!hangId) return { error: "missing hang" };
  if (!content) return { error: "empty message" };
  if (content.length > 2000) return { error: "message too long" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { error } = await supabase.from("messages").insert({
    hang_id: hangId,
    sender_id: user.id,
    content,
  });

  if (error) return { error: error.message };

  revalidatePath(`/match/${hangId}/chat`);
  return {};
}
