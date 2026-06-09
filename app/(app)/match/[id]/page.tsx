import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { SeenMarker } from "./client";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-match-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-match-sans",
});

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
      "id, user_a, user_b, preference_id, prompt_copy, event_title, event_url, event_venue, event_starts_at, event_source, matched, seen_a_at, seen_b_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (!hang || !hang.matched) notFound();

  const isUserA = hang.user_a === user.id;
  const isUserB = hang.user_b === user.id;
  if (!isUserA && !isUserB) notFound();

  const friendId = isUserA ? hang.user_b : hang.user_a;
  const isFirstView = isUserA ? !hang.seen_a_at : !hang.seen_b_at;

  const [meResult, friendResult] = await Promise.all([
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
  ]);

  const me =
    meResult.data?.display_name ?? meResult.data?.username ?? "You";
  const friend =
    friendResult.data?.display_name ??
    friendResult.data?.username ??
    "your friend";
  const myAvatar = meResult.data?.avatar_url ?? null;
  const friendAvatar = friendResult.data?.avatar_url ?? null;

  return (
    <main
      className={`${lora.variable} ${jakarta.variable} flex min-h-0 flex-1 flex-col`}
    >
      <header className="h-[58px] shrink-0 border-b border-[rgba(140,192,235,0.22)] bg-white/55 backdrop-blur-2xl">
        <div className="mx-auto flex h-full w-full max-w-[430px] items-center justify-between px-5">
          <Link
            href="/home"
            className="relative h-8 w-[57px] overflow-hidden opacity-90 transition active:opacity-60"
            aria-label="letshangg home"
          >
            <Image
              src="/logo-mark.png"
              alt="letshangg"
              fill
              sizes="57px"
              draggable={false}
              className="select-none object-contain"
              priority
            />
          </Link>
          <Link
            href="/home"
            aria-label="Back to swiping"
            className="grid h-9 w-9 place-items-center rounded-xl text-[#9AACBA] transition active:opacity-60"
          >
            <CloseIcon />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-[430px] flex-1 flex-col items-center px-5 pb-[max(18px,env(safe-area-inset-bottom))] pt-5">
        <div
          className={
            isFirstView
              ? "match-enter flex min-h-0 w-full flex-1 flex-col items-center text-center"
              : "flex min-h-0 w-full flex-1 flex-col items-center text-center"
          }
        >
          <div className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#F09070,#E87060)] px-6 py-3 font-[family-name:var(--font-match-sans)] text-[14px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_6px_20px_rgba(232,112,96,0.35)]">
            <span aria-hidden>✨</span>
            <span>Matched</span>
            <span aria-hidden>✨</span>
          </div>

          <section className="mt-5 w-full rounded-[26px] border border-white/85 bg-white/70 px-6 py-6 shadow-[0_8px_28px_rgba(44,62,78,0.1)] backdrop-blur-2xl">
            <h1 className="font-[family-name:var(--font-match-serif)] text-[clamp(20px,5.4vw,23px)] font-bold leading-[1.26] text-[#2D3E4E]">
              {hang.prompt_copy}
            </h1>
            {hang.event_title && hang.event_url ? (
              <a
                href={hang.event_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 block rounded-2xl border border-[rgba(140,192,235,0.22)] bg-white/70 px-4 py-3 text-left transition active:opacity-70"
              >
                <span className="block font-[family-name:var(--font-match-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#6AAAD8]">
                  Current event
                </span>
                <span className="mt-1 block font-[family-name:var(--font-match-sans)] text-[13px] font-bold leading-snug text-[#2D3E4E]">
                  {hang.event_title}
                </span>
                <span className="mt-1 block truncate font-[family-name:var(--font-match-sans)] text-[11px] font-semibold text-[#8A9CAB]">
                  {[formatEventDate(hang.event_starts_at), hang.event_venue]
                    .filter(Boolean)
                    .join(" · ") || hang.event_source || "View source"}
                </span>
              </a>
            ) : null}
          </section>

          <div className="mt-6">
            <div className="flex items-start justify-center gap-4">
              <MatchAvatar
                label="You"
                name={me}
                url={myAvatar}
                variant="me"
              />
              <span className="pt-[18px] text-[24px]" aria-hidden>
                ✨
              </span>
              <MatchAvatar
                label={friend}
                name={friend}
                url={friendAvatar}
                variant="friend"
              />
            </div>
            <p className="mt-4 font-[family-name:var(--font-match-serif)] text-[15px] italic text-[#7F96A8]">
              you both said yes
            </p>
          </div>

          <div className="mt-auto w-full pt-5">
            <Link
              href={`/match/${hang.id}/chat`}
              autoFocus
              aria-label={`Open conversation with ${friend}`}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] px-7 py-[15px] font-[family-name:var(--font-match-sans)] text-[15px] font-bold text-white shadow-[0_8px_24px_rgba(108,170,216,0.4)] transition active:opacity-80"
            >
              Open Conversation
              <ArrowRight />
            </Link>
            <Link
              href="/home"
              className="mt-3 inline-block font-[family-name:var(--font-match-sans)] text-[12px] text-[#9AACBA] transition hover:text-[#4A6173]"
            >
              Maybe later — keep swiping
            </Link>
          </div>
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

function formatEventDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function MatchAvatar({
  label,
  name,
  url,
  variant,
}: {
  label: string;
  name: string;
  url: string | null;
  variant: "me" | "friend";
}) {
  const isMe = variant === "me";
  const colors = isMe
    ? "bg-[#F0E4FA] text-[#7A4FAA]"
    : "bg-[#DCEEFA] text-[#4A7FA5]";

  return (
    <div className="w-[78px] text-center">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="mx-auto h-14 w-14 rounded-full border-[3px] border-white object-cover shadow-[0_4px_14px_rgba(44,62,78,0.12)]"
        />
      ) : (
        <span
          aria-hidden
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full border-[3px] border-white font-[family-name:var(--font-match-serif)] text-[23px] font-bold shadow-[0_4px_14px_rgba(44,62,78,0.12)] ${colors}`}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <p className="mt-2 truncate font-[family-name:var(--font-match-sans)] text-[12px] font-bold text-[#2D3E4E]">
        {label}
      </p>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
