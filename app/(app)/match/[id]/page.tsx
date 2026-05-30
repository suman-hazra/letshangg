import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SeenMarker } from "./client";
import { Avatar } from "../../_components/avatar";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: hang } = await supabase
    .from("hangs")
    .select(
      "id, user_a, user_b, preference_id, prompt_copy, matched, seen_a_at, seen_b_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!hang || !hang.matched) notFound();

  const isUserA = hang.user_a === user.id;
  const isUserB = hang.user_b === user.id;
  if (!isUserA && !isUserB) notFound();

  const friendId = isUserA ? hang.user_b : hang.user_a;
  const isFirstView = isUserA ? !hang.seen_a_at : !hang.seen_b_at;

  const [meResult, friendResult, prefResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", friendId)
      .maybeSingle(),
    supabase
      .from("preference_options")
      .select("label, activity_key")
      .eq("id", hang.preference_id)
      .maybeSingle(),
  ]);

  const me =
    meResult.data?.display_name ?? meResult.data?.username ?? "You";
  const friend =
    friendResult.data?.display_name ??
    friendResult.data?.username ??
    "your friend";
  const activityLabel = prefResult.data?.label ?? "this";
  const myAvatar = meResult.data?.avatar_url ?? null;
  const friendAvatar = friendResult.data?.avatar_url ?? null;

  // sms: deep link — encoded body, no recipient (user picks from contacts).
  const smsBody = `hey ${friend} — ${activityLabel.toLowerCase()} this weekend? matched via letshangg`;
  const smsHref = `sms:?body=${encodeURIComponent(smsBody)}`;

  return (
    <main className="min-h-dvh flex flex-col items-stretch px-6 pt-6 pb-10 bg-background">
      <p className="font-sans text-xs tracking-widest uppercase text-muted">
        letshangg
      </p>

      <div className="flex-1 flex flex-col items-center justify-center max-w-[430px] mx-auto w-full">
        <div
          className={
            isFirstView ? "match-enter w-full text-center" : "w-full text-center"
          }
        >
          {/* MATCHED marker */}
          <div className="flex items-center justify-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden
            />
            <span className="font-sans text-[11px] font-semibold tracking-[0.25em] uppercase text-ink">
              Matched
            </span>
          </div>

          {/* Hero copy */}
          <h1 className="mt-12 font-serif text-[44px] leading-[1.05] text-ink">
            {hang.prompt_copy}
          </h1>

          {/* Avatars + heart */}
          <div className="mt-14 flex items-center justify-center gap-4">
            <Avatar name={me} url={myAvatar} size="lg" />
            <HeartIcon />
            <Avatar name={friend} url={friendAvatar} size="lg" />
          </div>

          {/* Names */}
          <div className="mt-3 flex items-center justify-center gap-12">
            <span className="font-sans text-sm text-muted">{me}</span>
            <span className="font-sans text-sm text-muted">{friend}</span>
          </div>

          {/* Handwritten note */}
          <p className="mt-10 font-script text-[22px] text-muted">
            you both said yes
          </p>

          {/* Primary CTA — in-app chat */}
          <a
            href={`/match/${hang.id}/chat`}
            autoFocus
            aria-label={`Open conversation with ${friend}`}
            className="mt-12 inline-flex h-12 min-h-[48px] w-full max-w-[280px] items-center justify-center gap-2 rounded-full bg-ink px-7 text-sm font-semibold text-surface transition hover:opacity-90 focus:outline-2 focus:outline-offset-4 focus:outline-accent"
          >
            Open Conversation
            <ArrowRight />
          </a>

          {/* Secondary — drop into Messages instead */}
          <a
            href={smsHref}
            className="mt-3 inline-block font-sans text-sm text-muted hover:text-ink transition"
          >
            or text via Messages
          </a>
        </div>
      </div>

      <SeenMarker hangId={hang.id} />

      <style>
        {`
          @keyframes match-fade-in {
            from { opacity: 0; transform: scale(0.96); }
            to   { opacity: 1; transform: scale(1); }
          }
          .match-enter {
            animation: match-fade-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }
          @media (prefers-reduced-motion: reduce) {
            .match-enter { animation: none; }
          }
        `}
      </style>
    </main>
  );
}

function HeartIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="text-accent"
      aria-hidden
    >
      <path d="M12 21s-7-4.5-9.5-9C0.5 8 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4 4.5 8C19 16.5 12 21 12 21z" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
