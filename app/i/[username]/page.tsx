import { Lora, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHangsForUser } from "@/lib/hang-manager";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-invite-poppins",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-invite-jakarta",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-invite-lora",
});

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
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!inviter) {
    return (
      <Shell>
        <InfoState
          title="Invalid link."
          body={`We couldn't find a letshangg user with the handle @${username}.`}
          ctaLabel="Go home"
          ctaHref="/home"
        />
      </Shell>
    );
  }

  if (inviter.id === user.id) {
    return (
      <Shell>
        <InfoState
          title="That's your link."
          body="Share it with a friend — clicking your own won't do anything."
          ctaLabel="Back to Friends"
          ctaHref="/friends"
        />
      </Shell>
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

  let needsMatcher = false;
  const admin = createAdminClient();

  if (!existing) {
    const { error } = await admin.from("friendships").insert({
      requester_id: inviter.id,
      addressee_id: user.id,
      status: "accepted",
    });
    if (error && error.code !== "23505") {
      return (
        <Shell>
          <InfoState
            title="Couldn't accept invite."
            body={error.message}
            ctaLabel="Go home"
            ctaHref="/home"
          />
        </Shell>
      );
    }
    needsMatcher = true;
  } else if (existing.status === "pending") {
    await admin
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", existing.id);
    needsMatcher = true;
  }

  if (needsMatcher) {
    await Promise.allSettled([
      generateHangsForUser(user.id),
      generateHangsForUser(inviter.id),
    ]);
  }

  const friendName = inviter.display_name ?? inviter.username;
  const avatarUrl = inviter.avatar_url ?? null;

  // Where to send them next: finish onboarding if needed, else home.
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!myProfile?.display_name) {
    return (
      <Shell>
        <FriendedState
          friendName={friendName}
          avatarUrl={avatarUrl}
          body="Finish your profile so they can see who you are."
          ctaLabel="Set up profile"
          ctaHref="/onboarding/profile"
        />
      </Shell>
    );
  }

  const [{ data: activePrefs }, { data: votedPrefs }] = await Promise.all([
    supabase.from("preference_options").select("id").eq("is_active", true),
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
      <Shell>
        <FriendedState
          friendName={friendName}
          avatarUrl={avatarUrl}
          body="One more step — tell us what kinds of hangs you're up for."
          ctaLabel="Pick preferences"
          ctaHref="/onboarding/preferences-intro"
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <FriendedState
        friendName={friendName}
        avatarUrl={avatarUrl}
        body="If you've both picked overlapping hang preferences, suggestions will start showing up on your home."
        ctaLabel="Open home"
        ctaHref="/home"
      />
    </Shell>
  );
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${poppins.variable} ${jakarta.variable} ${lora.variable} relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)]`}
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute left-1/2 -top-24 h-[380px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[340px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />

      {/* Status bar spacer */}
      <div className="relative z-10 h-11 shrink-0" />

      {/* Logo-only top bar */}
      <header className="relative z-10 flex h-[58px] shrink-0 items-center border-b border-[rgba(140,192,235,0.22)] bg-white/55 px-5 backdrop-blur-2xl">
        <div className="relative h-8 w-[57px] opacity-90">
          <Image
            src="/logo-mark.png"
            alt="letshangg"
            fill
            sizes="57px"
            className="object-contain"
            priority
          />
        </div>
      </header>

      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}

// ─── Friended state (happy path) ─────────────────────────────────────────────

function FriendedState({
  friendName,
  avatarUrl,
  body,
  ctaLabel,
  ctaHref,
}: {
  friendName: string;
  avatarUrl: string | null;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const initial = friendName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-1 flex-col items-center justify-between px-7 pb-12 pt-10">
      {/* Top zone */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        {/* FRIENDED badge */}
        <div className="mb-8 flex items-center gap-2">
          <span className="h-[10px] w-[10px] rounded-full bg-[#6AAAD8] shadow-[0_0_0_3px_rgba(106,170,216,0.22)]" />
          <span className="font-[family-name:var(--font-invite-jakarta)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#6AAAD8]">
            Friended
          </span>
        </div>

        {/* Avatar */}
        <div className="mb-6">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-[90px] w-[90px] rounded-full border-[3.5px] border-white/90 object-cover shadow-[0_8px_28px_rgba(44,62,78,0.12)]"
            />
          ) : (
            <span className="flex h-[90px] w-[90px] items-center justify-center rounded-full border-[3.5px] border-white/90 bg-[#DCEEFA] font-[family-name:var(--font-invite-lora)] text-[36px] font-bold text-[#4A7FA5] shadow-[0_8px_28px_rgba(44,62,78,0.12)]">
              {initial}
            </span>
          )}
        </div>

        {/* Headline */}
        <h1 className="mb-4 max-w-[300px] font-[family-name:var(--font-invite-poppins)] text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#15293A]">
          You&apos;re now friends with {friendName}.
        </h1>

        {/* Subtext */}
        <p className="max-w-[300px] font-[family-name:var(--font-invite-jakarta)] text-[15px] font-medium leading-relaxed text-[#5C7A8A]">
          {body}
        </p>
      </div>

      {/* Bottom zone */}
      <div className="w-full">
        <Link
          href={ctaHref}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] py-[18px] font-[family-name:var(--font-invite-jakarta)] text-[17px] font-extrabold text-white shadow-[0_14px_30px_-8px_rgba(108,170,216,0.70)] transition active:opacity-80"
        >
          {ctaHref === "/home" && <HomeIcon />}
          <span>{ctaLabel}</span>
        </Link>
        <p className="text-center font-[family-name:var(--font-invite-lora)] text-[13px] italic text-[#AFBEC9]">
          no awkward intros.
        </p>
      </div>
    </div>
  );
}

// ─── Info / error state ───────────────────────────────────────────────────────

function InfoState({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-between px-7 pb-12 pt-10">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <h1 className="mb-4 max-w-[300px] font-[family-name:var(--font-invite-poppins)] text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#15293A]">
          {title}
        </h1>
        <p className="max-w-[300px] font-[family-name:var(--font-invite-jakarta)] text-[15px] font-medium leading-relaxed text-[#5C7A8A]">
          {body}
        </p>
      </div>

      <div className="w-full">
        <Link
          href={ctaHref}
          className="mb-4 flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] py-[18px] font-[family-name:var(--font-invite-jakarta)] text-[17px] font-extrabold text-white shadow-[0_14px_30px_-8px_rgba(108,170,216,0.70)] transition active:opacity-80"
        >
          {ctaLabel}
        </Link>
        <p className="text-center font-[family-name:var(--font-invite-lora)] text-[13px] italic text-[#AFBEC9]">
          no awkward intros.
        </p>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}
