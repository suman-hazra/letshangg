import { notFound, redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { FriendChatRoom } from "./client";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-chat-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-chat-sans",
});

export default async function FriendChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: friendshipId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
    notFound();
  }

  const friendId =
    friendship.requester_id === user.id
      ? friendship.addressee_id
      : friendship.requester_id;

  const [friendResult, messagesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", friendId)
      .maybeSingle(),
    supabase
      .from("friendship_messages")
      .select("id, sender_id, content, created_at")
      .eq("friendship_id", friendship.id)
      .order("created_at", { ascending: true }),
  ]);

  const friendName =
    friendResult.data?.display_name ??
    friendResult.data?.username ??
    "your friend";
  const friendAvatar = friendResult.data?.avatar_url ?? null;

  return (
    <div
      className={`${lora.variable} ${jakarta.variable} flex min-h-0 flex-1 flex-col`}
    >
      <FriendChatRoom
        friendshipId={friendship.id}
        myId={user.id}
        friendName={friendName}
        friendAvatar={friendAvatar}
        initialMessages={messagesResult.data ?? []}
      />
    </div>
  );
}
