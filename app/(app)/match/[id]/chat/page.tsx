import { notFound, redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { ChatRoom } from "./client";

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
    .select("id, user_a, user_b, matched")
    .eq("id", hangId)
    .maybeSingle();

  if (!hang || !hang.matched) notFound();
  const isUserA = hang.user_a === user.id;
  const isUserB = hang.user_b === user.id;
  if (!isUserA && !isUserB) notFound();

  const friendId = isUserA ? hang.user_b : hang.user_a;

  const [friendResult, messagesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", friendId)
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

  return (
    <div
      className={`${lora.variable} ${jakarta.variable} flex min-h-0 flex-1 flex-col`}
    >
      <ChatRoom
        hangId={hang.id}
        myId={user.id}
        friendName={friendName}
        friendAvatar={friendAvatar}
        initialMessages={messagesResult.data ?? []}
      />
    </div>
  );
}
