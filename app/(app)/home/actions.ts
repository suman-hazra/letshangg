"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMatchEmail } from "@/lib/email";
import { generateHangsForUser } from "@/lib/hang-manager";
import { addDemoFriendsForUser } from "@/lib/demo";

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

  // Determine which column to write to. Read via the session client so RLS
  // (hangs_read_party) confirms the caller is actually a party to this hang.
  const { data: hang } = await supabase
    .from("hangs")
    .select("id, user_a, user_b, swipe_a, swipe_b, preference_id, prompt_copy")
    .eq("id", hangId)
    .maybeSingle();

  if (!hang) redirect("/home");

  const isUserA = hang.user_a === user.id;
  const isUserB = hang.user_b === user.id;
  if (!isUserA && !isUserB) redirect("/home");

  const otherSide = isUserA ? hang.swipe_b : hang.swipe_a;
  const matched = verdict === "right" && otherSide === "right";

  const swipedAt = new Date().toISOString();
  const update: {
    swipe_a?: "right" | "left";
    swipe_b?: "right" | "left";
    swipe_a_at?: string;
    swipe_b_at?: string;
    matched?: boolean;
  } = isUserA
    ? { swipe_a: verdict, swipe_a_at: swipedAt }
    : { swipe_b: verdict, swipe_b_at: swipedAt };
  if (matched) update.matched = true;

  // Clients can't UPDATE hangs directly (RLS denies it) — that's what stopped
  // a party from forging a match or setting the other user's swipe. We've
  // already authorized the caller and scoped `update` to their own columns, so
  // the write goes through the service-role client.
  const admin = createAdminClient();
  await admin.from("hangs").update(update).eq("id", hangId);

  revalidatePath("/home");

  // When the swipe completes the match, notify the OTHER user by email.
  // On Vercel serverless we can't truly fire-and-forget, so we await with a
  // 3s cap. Email never blocks the user beyond that — match screen loads even
  // if Resend is slow or unreachable.
  if (matched) {
    const otherUserId = isUserA ? hang.user_b : hang.user_a;
    await Promise.race([
      notifyMatch(otherUserId, user.id, hang.id, hang.prompt_copy).catch(
        (e) => console.error("notifyMatch failed", e),
      ),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
    redirect(`/match/${hangId}`);
  }
  redirect("/home");
}

export async function refreshHangs() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await generateHangsForUser(user.id);
  revalidatePath("/home");
  redirect("/home");
}

/** Friends the demo personas and seeds hangs — the "try it solo" path. */
export async function tryDemoFriends() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await addDemoFriendsForUser(user.id).catch((e) =>
    console.error("demo friends setup failed", e),
  );
  revalidatePath("/home");
  revalidatePath("/friends");
  redirect("/home");
}

async function notifyMatch(
  recipientId: string,
  swiperId: string,
  hangId: string,
  promptCopy: string,
): Promise<void> {
  const admin = createAdminClient();

  // Look up recipient (email + display name) and swiper (display name).
  const [{ data: rUser }, { data: rProfile }, { data: sProfile }] =
    await Promise.all([
      admin.auth.admin.getUserById(recipientId),
      admin
        .from("profiles")
        .select("display_name, username")
        .eq("id", recipientId)
        .maybeSingle(),
      admin
        .from("profiles")
        .select("display_name, username")
        .eq("id", swiperId)
        .maybeSingle(),
    ]);

  const toEmail = rUser?.user?.email;
  if (!toEmail) return;

  const toName = rProfile?.display_name ?? rProfile?.username ?? "you";
  const friendName =
    sProfile?.display_name ?? sProfile?.username ?? "your friend";

  await sendMatchEmail({
    toEmail,
    toName,
    friendName,
    promptCopy,
    matchId: hangId,
  });
}
