"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHangsForUser } from "@/lib/hang-manager";
import { sendFriendRequestEmail } from "@/lib/email";

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export async function sendFriendRequest(formData: FormData) {
  const username = String(formData.get("username") ?? "")
    .trim()
    .toLowerCase();

  if (!USERNAME_RE.test(username)) {
    redirect(
      `/friends/add?error=${encodeURIComponent(
        "username must be 3-20 letters, numbers, or underscores",
      )}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Look up the user being added.
  const { data: target } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!target) {
    redirect(
      `/friends/add?error=${encodeURIComponent(`no one with username "${username}" yet`)}`,
    );
  }

  if (target.id === user.id) {
    redirect(
      `/friends/add?error=${encodeURIComponent("can't add yourself")}`,
    );
  }

  // Already linked? Either direction.
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status, requester_id, addressee_id")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${user.id})`,
    )
    .maybeSingle();

  if (existing) {
    if (existing.status === "accepted") {
      redirect(
        `/friends/add?error=${encodeURIComponent(
          `you're already friends with ${target.display_name ?? target.username}`,
        )}`,
      );
    }
    if (existing.status === "pending") {
      const yourRequest = existing.requester_id === user.id;
      redirect(
        `/friends/add?error=${encodeURIComponent(
          yourRequest
            ? "you already sent them a request"
            : "they already sent you a request — accept it from Friends",
        )}`,
      );
    }
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: target.id,
    status: "pending",
  });

  if (error) {
    redirect(`/friends/add?error=${encodeURIComponent(error.message)}`);
  }

  // Notify the addressee by email. Use a 3s cap so a slow Resend never blocks.
  const admin = createAdminClient();
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .maybeSingle();
  const { data: addresseeUser } = await admin.auth.admin.getUserById(target.id);
  const toEmail = addresseeUser?.user?.email;
  if (toEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://letshangg.app";
    await Promise.race([
      sendFriendRequestEmail({
        toEmail,
        toName: target.display_name ?? target.username,
        requesterName:
          requesterProfile?.display_name ?? requesterProfile?.username ?? "Someone",
        friendsUrl: `${siteUrl}/friends`,
      }).catch((e) => console.error("sendFriendRequestEmail failed", e)),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  }

  revalidatePath("/friends");
  redirect(`/friends?sent=${encodeURIComponent(target.display_name ?? target.username)}`);
}

export async function acceptFriendRequest(formData: FormData) {
  const friendshipId = String(formData.get("friendship_id") ?? "");
  if (!friendshipId) redirect("/friends");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Only the addressee can accept.
  const { data: row } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .eq("id", friendshipId)
    .maybeSingle();

  if (!row || row.addressee_id !== user.id || row.status !== "pending") {
    redirect("/friends");
  }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id);

  if (error) {
    redirect(`/friends?error=${encodeURIComponent(error.message)}`);
  }

  // Fetch requester profile for the friended confirmation screen.
  const { data: requesterProfile } = await supabase
    .from("profiles")
    .select("display_name, username, avatar_url")
    .eq("id", row.requester_id)
    .maybeSingle();

  // Fire matcher for both parties so hangs appear immediately for both.
  await Promise.allSettled([
    generateHangsForUser(row.requester_id),
    generateHangsForUser(row.addressee_id),
  ]);

  revalidatePath("/friends");
  revalidatePath("/home");

  const friendName =
    requesterProfile?.display_name ?? requesterProfile?.username ?? "your friend";
  const params = new URLSearchParams({ name: friendName });
  if (requesterProfile?.avatar_url) {
    params.set("avatar", requesterProfile.avatar_url);
  }
  redirect(`/friends/friended?${params.toString()}`);
}

export async function declineFriendRequest(formData: FormData) {
  const friendshipId = String(formData.get("friendship_id") ?? "");
  if (!friendshipId) redirect("/friends");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Use admin client to delete the row outright — declines shouldn't linger as
  // a confusing 'declined' state in the requester's view (they'd see "they
  // said no" forever). Delete is cleanest for v2.
  const admin = createAdminClient();
  await admin
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "pending");

  revalidatePath("/friends");
  redirect("/friends");
}

export async function removeFriend(formData: FormData) {
  const friendshipId = String(formData.get("friendship_id") ?? "");
  if (!friendshipId) redirect("/friends");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: row } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .eq("id", friendshipId)
    .maybeSingle();

  if (
    !row ||
    row.status !== "accepted" ||
    (row.requester_id !== user.id && row.addressee_id !== user.id)
  ) {
    redirect("/friends");
  }

  const admin = createAdminClient();
  const friendId =
    row.requester_id === user.id ? row.addressee_id : row.requester_id;

  const [{ error: deleteFriendshipError }, { error: deleteHangsError }] =
    await Promise.all([
      admin.from("friendships").delete().eq("id", row.id),
      admin
        .from("hangs")
        .delete()
        .or(
          `and(user_a.eq.${user.id},user_b.eq.${friendId}),and(user_a.eq.${friendId},user_b.eq.${user.id})`,
        ),
    ]);

  const error = deleteFriendshipError ?? deleteHangsError;
  if (error) {
    redirect(`/friends?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/friends");
  revalidatePath("/home");
  redirect("/friends");
}
