"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { maybeSendPersonaFriendReply } from "@/lib/demo";

export async function sendFriendMessage(
  prevState: unknown,
  formData: FormData,
): Promise<{ error?: string }> {
  const friendshipId = String(formData.get("friendship_id") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!friendshipId) return { error: "missing friendship" };
  if (!content) return { error: "empty message" };
  if (content.length > 2000) return { error: "message too long" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .eq("id", friendshipId)
    .maybeSingle();

  if (
    !friendship ||
    friendship.status !== "accepted" ||
    (friendship.requester_id !== user.id && friendship.addressee_id !== user.id)
  ) {
    return { error: "not friends" };
  }

  const { error } = await supabase.from("friendship_messages").insert({
    friendship_id: friendshipId,
    sender_id: user.id,
    content,
  });

  if (error) return { error: error.message };

  // Demo personas reply in character; no-op for real friends.
  await maybeSendPersonaFriendReply(friendshipId, user.id, content).catch(
    (e) => console.error("persona reply failed", e),
  );

  revalidatePath(`/friends/${friendshipId}/chat`);
  return {};
}

export async function markFriendMessagesRead(
  friendshipId: string,
): Promise<void> {
  if (!friendshipId) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: friendship } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .eq("id", friendshipId)
    .maybeSingle();

  if (
    !friendship ||
    friendship.status !== "accepted" ||
    (friendship.requester_id !== user.id && friendship.addressee_id !== user.id)
  ) {
    return;
  }

  await supabase.from("friendship_message_reads").upsert(
    {
      friendship_id: friendshipId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "friendship_id,user_id" },
  );

  revalidatePath("/friends");
  revalidatePath(`/friends/${friendshipId}/chat`);
}
