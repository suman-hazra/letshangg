import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "./client";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: hangId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Confirm user is party to a matched hang.
  const { data: hang } = await supabase
    .from("hangs")
    .select(
      "id, user_a, user_b, preference_id, prompt_copy, matched",
    )
    .eq("id", hangId)
    .maybeSingle();

  if (!hang || !hang.matched) notFound();
  const isUserA = hang.user_a === user.id;
  const isUserB = hang.user_b === user.id;
  if (!isUserA && !isUserB) notFound();

  const friendId = isUserA ? hang.user_b : hang.user_a;

  const [friendResult, prefResult, messagesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", friendId)
      .maybeSingle(),
    supabase
      .from("preference_options")
      .select("label, emoji")
      .eq("id", hang.preference_id)
      .maybeSingle(),
    supabase
      .from("messages")
      .select("id, sender_id, content, created_at")
      .eq("hang_id", hang.id)
      .order("created_at", { ascending: true }),
  ]);

  const friendName =
    friendResult.data?.display_name ??
    friendResult.data?.username ??
    "your friend";
  const friendAvatar = friendResult.data?.avatar_url ?? null;
  const activityLabel = prefResult.data?.label ?? "hang";
  const activityEmoji = prefResult.data?.emoji ?? "🤝";

  return (
    <ChatRoom
      hangId={hang.id}
      myId={user.id}
      friendName={friendName}
      friendAvatar={friendAvatar}
      activityLabel={activityLabel}
      activityEmoji={activityEmoji}
      initialMessages={messagesResult.data ?? []}
      promptCopy={hang.prompt_copy}
    />
  );
}
