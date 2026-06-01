import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHangsForUser } from "@/lib/hang-manager";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: rawUsername } = await params;
  const username = rawUsername.trim().toLowerCase();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/i/${encodeURIComponent(username)}`);

  // Look up inviter.
  const { data: inviter } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();

  if (!inviter) {
    return (
      <InviteResult
        title="Invalid link."
        body={`We couldn't find a letshangg user with the handle @${username}.`}
        ctaLabel="Go home"
        ctaHref="/home"
      />
    );
  }

  if (inviter.id === user.id) {
    return (
      <InviteResult
        title="That's your link."
        body="Share this with a friend — clicking your own won't do anything."
        ctaLabel="Back to Friends"
        ctaHref="/friends"
      />
    );
  }

  // Check existing friendship state (either direction).
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${inviter.id}),and(requester_id.eq.${inviter.id},addressee_id.eq.${user.id})`,
    )
    .maybeSingle();

  // Decide whether to create or upgrade to accepted.
  let needsMatcher = false;
  const admin = createAdminClient();

  if (!existing) {
    // Net new — create as accepted. The inviter is the requester so the
    // semantics still match "they sent the invite, you accepted by clicking".
    const { error } = await admin.from("friendships").insert({
      requester_id: inviter.id,
      addressee_id: user.id,
      status: "accepted",
    });
    if (error && error.code !== "23505") {
      // 23505 = unique violation; treat as already-linked (raced)
      return (
        <InviteResult
          title="Couldn't accept invite."
          body={error.message}
          ctaLabel="Go home"
          ctaHref="/home"
        />
      );
    }
    needsMatcher = true;
  } else if (existing.status === "pending") {
    // Either side's pending — upgrade to accepted.
    await admin
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", existing.id);
    needsMatcher = true;
  }
  // If existing.status === 'accepted', no-op — already friends.

  if (needsMatcher) {
    // Fire matcher for both parties. Best-effort.
    await Promise.allSettled([
      generateHangsForUser(user.id),
      generateHangsForUser(inviter.id),
    ]);
  }

  // Where to send them next: finish onboarding if needed, else home.
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!myProfile?.display_name) {
    return (
      <InviteResult
        title={`You're now friends with ${inviter.display_name ?? inviter.username}.`}
        body="Finish your profile so they can see who you are."
        ctaLabel="Set up profile"
        ctaHref="/onboarding/profile"
        accent
      />
    );
  }

  const [{ data: activePrefs }, { data: votedPrefs }] = await Promise.all([
    supabase
      .from("preference_options")
      .select("id")
      .eq("is_active", true),
    supabase
      .from("user_preferences")
      .select("preference_id")
      .eq("user_id", user.id),
  ]);

  const activePrefIds = new Set((activePrefs ?? []).map((p) => p.id));
  const votedActiveCount = (votedPrefs ?? []).filter((p) =>
    activePrefIds.has(p.preference_id),
  ).length;

  if (votedActiveCount < activePrefIds.size) {
    return (
      <InviteResult
        title={`You're now friends with ${inviter.display_name ?? inviter.username}.`}
        body="One more step — tell us what kinds of hangs you're up for."
        ctaLabel="Pick preferences"
        ctaHref="/onboarding/preferences-intro"
        accent
      />
    );
  }

  return (
    <InviteResult
      title={`You're now friends with ${inviter.display_name ?? inviter.username}.`}
      body="If you've both picked overlapping preferences, hangs will show up on your home queue."
      ctaLabel="Open home"
      ctaHref="/home"
      accent
    />
  );
}

function InviteResult({
  title,
  body,
  ctaLabel,
  ctaHref,
  accent,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  accent?: boolean;
}) {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[430px] text-center">
        <p className="font-sans text-sm tracking-widest uppercase text-muted">
          letshangg
        </p>

        {accent && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden
            />
            <span className="font-sans text-[11px] font-semibold tracking-[0.25em] uppercase text-ink">
              Friended
            </span>
          </div>
        )}

        <h1 className={`mt-${accent ? "8" : "12"} font-serif text-3xl leading-tight text-ink`}>
          {title}
        </h1>

        <p className="mt-4 font-sans text-base text-muted leading-relaxed">
          {body}
        </p>

        <Link
          href={ctaHref}
          autoFocus
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-sm font-semibold text-surface transition hover:opacity-90"
        >
          {ctaLabel}
        </Link>

        <p className="mt-10 font-script text-lg text-muted">no awkward intros.</p>
      </div>
    </main>
  );
}
