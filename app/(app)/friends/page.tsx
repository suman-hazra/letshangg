import { redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import {
  type AcceptedFriend,
  type Match,
  type PendingFriend,
  FriendsScreen,
} from "./client";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-friends-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-friends-sans",
});

type FriendshipRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
};

type ProfileRow = {
  display_name: string | null;
  username: string;
  avatar_url: string | null;
};

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: rows }, { data: matchRows }] = await Promise.all([
    supabase
      .from("friendships")
      .select("id, requester_id, addressee_id, status")
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .order("created_at", { ascending: false }),
    supabase
      .from("hangs")
      .select("id, user_a, user_b, preference_id, prompt_copy")
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq("matched", true)
      .order("created_at", { ascending: false }),
  ]);

  const friendships = (rows ?? []) as FriendshipRow[];
  const acceptedRows = friendships.filter((r) => r.status === "accepted");
  const incomingPendingRows = friendships.filter(
    (r) => r.status === "pending" && r.addressee_id === user.id,
  );
  const outgoingPendingRows = friendships.filter(
    (r) => r.status === "pending" && r.requester_id === user.id,
  );

  const friendIds = new Set<string>();
  for (const row of acceptedRows) {
    friendIds.add(
      row.requester_id === user.id ? row.addressee_id : row.requester_id,
    );
  }
  for (const row of incomingPendingRows) friendIds.add(row.requester_id);
  for (const row of outgoingPendingRows) friendIds.add(row.addressee_id);

  const hangs = matchRows ?? [];
  const matchFriendIds = hangs.map((h) =>
    h.user_a === user.id ? h.user_b : h.user_a,
  );
  const prefIds = hangs.map((h) => h.preference_id);
  for (const id of matchFriendIds) friendIds.add(id);

  const [profilesResult, prefsResult] = await Promise.all([
    friendIds.size > 0
      ? supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", Array.from(friendIds))
      : Promise.resolve({ data: [] }),
    prefIds.length > 0
      ? supabase
          .from("preference_options")
          .select("id, label, emoji")
          .in("id", prefIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileById = new Map<string, ProfileRow>();
  for (const profile of profilesResult.data ?? []) {
    profileById.set(profile.id, {
      display_name: profile.display_name,
      username: profile.username,
      avatar_url: profile.avatar_url,
    });
  }

  const prefById = new Map<string, { label: string; emoji: string | null }>();
  for (const pref of prefsResult.data ?? []) {
    prefById.set(pref.id, { label: pref.label, emoji: pref.emoji });
  }

  const matches: Match[] = hangs.map((h) => {
    const friendId = h.user_a === user.id ? h.user_b : h.user_a;
    const profile = profileById.get(friendId);
    const pref = prefById.get(h.preference_id);
    return {
      hangId: h.id,
      promptCopy: h.prompt_copy,
      friendDisplayName: profile?.display_name ?? profile?.username ?? "friend",
      friendUsername: profile?.username ?? "",
      friendAvatarUrl: profile?.avatar_url ?? null,
      activityEmoji: pref?.emoji ?? "🤝",
      activityLabel: pref?.label ?? "hang",
    };
  });

  const accepted = acceptedRows.map((row) =>
    toFriend(
      row,
      row.requester_id === user.id ? row.addressee_id : row.requester_id,
      profileById,
    ),
  );
  const incomingPending = incomingPendingRows.map((row) =>
    toFriend(row, row.requester_id, profileById),
  );
  const outgoingPending = outgoingPendingRows.map((row) =>
    toFriend(row, row.addressee_id, profileById),
  );

  return (
    <main
      className={`${lora.variable} ${jakarta.variable} relative z-10 flex-1 overflow-y-auto px-5 pb-8 pt-6`}
    >
      <FriendsScreen
        sent={sent ? decodeURIComponent(sent) : null}
        error={error ? decodeURIComponent(error) : null}
        matches={matches}
        accepted={accepted}
        incomingPending={incomingPending}
        outgoingPending={outgoingPending}
      />
    </main>
  );
}

function toFriend(
  row: FriendshipRow,
  friendId: string,
  profileById: Map<string, ProfileRow>,
): AcceptedFriend | PendingFriend {
  const profile = profileById.get(friendId);
  const username = profile?.username ?? "friend";

  return {
    friendshipId: row.id,
    displayName: profile?.display_name ?? username,
    username,
    avatarUrl: profile?.avatar_url ?? null,
  };
}
