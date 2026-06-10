import { redirect } from "next/navigation";
import Link from "next/link";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { generateHangsForUser, rankPendingHangs } from "@/lib/hang-manager";
import { triggerDemoSwipeBacks } from "@/lib/demo";
import { refreshHangs, swipeHang, tryDemoFriends } from "./actions";

const lora = Lora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-home-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-home-sans",
});

const ACTIVITY_EMOJI: Record<string, string> = {
  coffee: "☕",
  pizza: "🍕",
  movie: "🎬",
  drinks: "🍸",
  house_party: "🏠",
  dancing: "🪩",
  workout: "💪",
  bike: "🚲",
  pickup_sport: "🏀",
  rock_climbing: "🧗",
  hike: "🥾",
  park: "🌳",
  sunset_walk: "🌅",
  beach: "🏖️",
  show: "🎤",
  museum: "🏛️",
  bookstore: "📚",
  theater_comedy: "🎭",
  cooking: "🍳",
  pottery_class: "🎨",
  thrift: "🛍️",
  bowling: "🎳",
  game_night: "🎲",
  arcade_mini_golf: "🕹️",
  ice_cream: "🍦",
  restaurant: "🍽️",
  self_care: "🧖",
  day_trip: "🚗",
  escape_room: "🔐",
  festival: "🎪",
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type HangRow = {
  id: string;
  user_a: string;
  user_b: string;
  preference_id: string;
  prompt_copy: string;
  event_title: string | null;
  event_url: string | null;
  event_venue: string | null;
  event_starts_at: string | null;
  event_source: string | null;
  swipe_a: "right" | "left" | null;
  swipe_b: "right" | "left" | null;
  created_at: string;
};

// How many pending hangs (per side) to pull into the ranking window. The
// friend's swipe state is used for ordering only — never rendered.
const QUEUE_WINDOW = 10;

const PENDING_HANG_SELECT =
  "id, user_a, user_b, preference_id, prompt_copy, event_title, event_url, event_venue, event_starts_at, event_source, swipe_a, swipe_b, created_at";

async function fetchPendingHang(
  supabase: SupabaseClient,
  userId: string,
): Promise<HangRow | null> {
  const [resultA, resultB] = await Promise.all([
    supabase
      .from("hangs")
      .select(PENDING_HANG_SELECT)
      .eq("user_a", userId)
      .is("swipe_a", null)
      .eq("matched", false)
      .order("created_at", { ascending: true })
      .limit(QUEUE_WINDOW),
    supabase
      .from("hangs")
      .select(PENDING_HANG_SELECT)
      .eq("user_b", userId)
      .is("swipe_b", null)
      .eq("matched", false)
      .order("created_at", { ascending: true })
      .limit(QUEUE_WINDOW),
  ]);

  const ranked = rankPendingHangs(
    [...(resultA.data ?? []), ...(resultB.data ?? [])],
    userId,
  );

  return ranked[0] ?? null;
}

async function countPendingHangs(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const [{ count: countA }, { count: countB }] = await Promise.all([
    supabase
      .from("hangs")
      .select("id", { count: "exact", head: true })
      .eq("user_a", userId)
      .is("swipe_a", null)
      .eq("matched", false),
    supabase
      .from("hangs")
      .select("id", { count: "exact", head: true })
      .eq("user_b", userId)
      .is("swipe_b", null)
      .eq("matched", false),
  ]);

  return (countA ?? 0) + (countB ?? 0);
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Demo personas swipe back after a short "thinking" delay; completed
  // matches are picked up by the unseen-match redirect just below.
  const demo = await triggerDemoSwipeBacks(user.id);

  // Unseen match auto-redirect.
  const [{ data: unseenMatchA }, { data: unseenMatchB }] = await Promise.all([
    supabase
      .from("hangs")
      .select("id")
      .eq("user_a", user.id)
      .eq("matched", true)
      .is("seen_a_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("hangs")
      .select("id")
      .eq("user_b", user.id)
      .eq("matched", true)
      .is("seen_b_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (unseenMatchA) redirect(`/match/${unseenMatchA.id}`);
  if (unseenMatchB) redirect(`/match/${unseenMatchB.id}`);

  // Fetch pending hangs; auto-run hang manager once if the queue is empty.
  let hang = await fetchPendingHang(supabase, user.id);
  if (!hang) {
    await generateHangsForUser(user.id);
    hang = await fetchPendingHang(supabase, user.id);
  }

  if (!hang) {
    const { count: friendCount } = await supabase
      .from("friendships")
      .select("id", { count: "exact", head: true })
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted");

    const hasFriends = (friendCount ?? 0) > 0;

    return (
      <main
        className={`${lora.variable} ${jakarta.variable} flex flex-1 flex-col items-center px-6 pb-12`}
      >
        <div className="flex-1 flex items-center justify-center w-full max-w-[430px]">
          {demo.pending > 0 ? (
            <div className="text-center">
              <div className="text-4xl mb-6" aria-hidden>🤞</div>
              <h1 className="font-[family-name:var(--font-home-serif)] text-3xl leading-tight text-[#2D3E4E]">
                Your friends are
                <br />
                thinking it over.
              </h1>
              <p className="mt-6 font-[family-name:var(--font-home-sans)] text-base leading-relaxed text-[#4A6173]">
                You said yes — now it&apos;s their turn. Check back in a
                moment.
              </p>
              <form action={refreshHangs} className="mt-8">
                <button
                  type="submit"
                  className="inline-block rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] px-7 py-3 font-[family-name:var(--font-home-sans)] text-sm font-bold text-white shadow-[0_8px_20px_rgba(108,170,216,0.35)]"
                >
                  Check now
                </button>
              </form>
            </div>
          ) : hasFriends ? (
            <div className="text-center">
              <h1 className="font-[family-name:var(--font-home-serif)] text-3xl leading-tight text-[#2D3E4E]">
                You&apos;re all
                <br />
                caught up.
              </h1>
              <p className="mt-6 font-[family-name:var(--font-home-sans)] text-base text-[#4A6173]">
                New hangs surface when you or a friend updates their preferences.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-4xl mb-6" aria-hidden>👋</div>
              <h1 className="font-[family-name:var(--font-home-serif)] text-3xl leading-tight text-[#2D3E4E]">
                Add friends to
                <br />
                get started.
              </h1>
              <p className="mt-6 font-[family-name:var(--font-home-sans)] text-base leading-relaxed text-[#4A6173]">
                When you and a friend both like the same activity, a hang suggestion will show up right here.
              </p>
              <Link
                href="/friends"
                className="mt-8 inline-block rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] px-7 py-3 font-[family-name:var(--font-home-sans)] text-sm font-bold text-white shadow-[0_8px_20px_rgba(108,170,216,0.35)]"
              >
                Add friends
              </Link>
              <form action={tryDemoFriends} className="mt-4">
                <button
                  type="submit"
                  className="font-[family-name:var(--font-home-sans)] text-[13px] font-bold text-[#6FA8CC] underline decoration-[rgba(140,192,235,0.6)] underline-offset-4"
                >
                  No friends here yet? Try it with demo friends
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Render the hang card.
  const friendId = hang.user_a === user.id ? hang.user_b : hang.user_a;

  const [friendResult, prefResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, username, avatar_url")
      .eq("id", friendId)
      .maybeSingle(),
    supabase
      .from("preference_options")
      .select("label, emoji, activity_key")
      .eq("id", hang.preference_id)
      .maybeSingle(),
  ]);

  const friendProfile = friendResult.data;
  const prefRow = prefResult.data;

  const friendName =
    friendProfile?.display_name ?? friendProfile?.username ?? "your friend";
  const friendAvatar = friendProfile?.avatar_url ?? null;
  const activityEmoji =
    prefRow?.emoji ?? ACTIVITY_EMOJI[prefRow?.activity_key ?? ""] ?? "🤝";
  const activityLabel = prefRow?.label ?? "hang";
  const pendingCount = await countPendingHangs(supabase, user.id);

  return (
    <main
      className={`${lora.variable} ${jakarta.variable} flex flex-1 flex-col items-center px-5 pb-7 pt-5`}
    >
      <div className="flex w-full max-w-[430px] items-center justify-between gap-4">
        <p className="flex min-w-0 items-center gap-2 font-[family-name:var(--font-home-sans)] text-[12px] font-bold leading-none">
          <span className="text-[14px]" aria-hidden>
            ✨
          </span>
          <span className="truncate">
            <span className="text-[#7A4FAA]">{friendName}</span>{" "}
            <span className="text-[#9AACBA]">wants to hang</span>
          </span>
        </p>
        <p className="shrink-0 font-[family-name:var(--font-home-sans)] text-[11px] font-bold text-[#B0C2CF]">
          1 of {Math.max(pendingCount, 1)}
        </p>
      </div>

      <div className="flex min-h-0 w-full max-w-[430px] flex-1 flex-col items-center justify-center">
        <div className="relative w-full rotate-[-1.5deg] rounded-[30px] border-[3px] border-white bg-white px-6 pb-7 pt-12 text-center shadow-[0_14px_36px_rgba(44,62,78,0.16)]">
          <div className="absolute left-1/2 top-0 grid h-16 w-16 -translate-x-1/2 -translate-y-6 place-items-center rounded-full border-4 border-white bg-[#FFEACC] text-[30px] shadow-[0_6px_18px_rgba(44,62,78,0.16)]">
            <span aria-hidden>{activityEmoji}</span>
          </div>

          <p className="mx-auto inline-flex max-w-full rounded-full bg-[rgba(140,192,235,0.18)] px-3 py-1 font-[family-name:var(--font-home-sans)] text-[10px] font-bold uppercase tracking-[0.08em] text-[#4A7FA5]">
            <span className="truncate">{activityLabel}</span>
          </p>

          <div className="relative mt-5 rounded-[22px] border border-[#FCEFC7] bg-[#FFF9E8] px-5 py-5">
            <p className="font-[family-name:var(--font-home-serif)] text-[20px] font-medium leading-[1.35] text-[#2D3E4E]">
              {hang.prompt_copy}
            </p>
            {hang.event_title && hang.event_url ? (
              <a
                href={hang.event_url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-2xl border border-[#F5E3B2] bg-white/65 px-4 py-3 text-left transition active:opacity-70"
              >
                <span className="block truncate font-[family-name:var(--font-home-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#C07A32]">
                  Current event
                </span>
                <span className="mt-1 block font-[family-name:var(--font-home-sans)] text-[13px] font-bold leading-snug text-[#2D3E4E]">
                  {hang.event_title}
                </span>
                <span className="mt-1 block truncate font-[family-name:var(--font-home-sans)] text-[11px] font-semibold text-[#8A9CAB]">
                  {[formatEventDate(hang.event_starts_at), hang.event_venue]
                    .filter(Boolean)
                    .join(" · ") || hang.event_source || "View source"}
                </span>
              </a>
            ) : null}
            <span
              className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-2 rotate-45 border-b border-r border-[#FCEFC7] bg-[#FFF9E8]"
              aria-hidden
            />
          </div>

          <div className="mt-7 flex items-center justify-center gap-2">
            <DisplayAvatar name={friendName} url={friendAvatar} />
            <span className="font-[family-name:var(--font-home-sans)] text-[13px] font-bold text-[#2D3E4E]">
              {friendName}
            </span>
            <span aria-hidden>🤝</span>
          </div>
        </div>

        <div className="mt-7 flex items-center justify-center gap-5">
          <form action={swipeHang}>
            <input type="hidden" name="hang_id" value={hang.id} />
            <input type="hidden" name="verdict" value="left" />
            <VerdictButton kind="nay" aria-label={`Skip ${activityLabel}`} />
          </form>
          <form action={swipeHang}>
            <input type="hidden" name="hang_id" value={hang.id} />
            <input type="hidden" name="verdict" value="right" />
            <VerdictButton kind="yay" aria-label={`Yay to ${activityLabel}`} />
          </form>
        </div>

        <p className="mt-4 font-[family-name:var(--font-home-serif)] text-[12px] italic text-[#AFBEC9]">
          no one sees what you skip.
        </p>
      </div>
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

function VerdictButton({
  kind,
  ...rest
}: {
  kind: "yay" | "nay";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isYay = kind === "yay";
  return (
    <button
      type="submit"
      className={`flex h-[68px] w-[68px] flex-col items-center justify-center rounded-[22px] transition active:scale-90 ${
        isYay
          ? "bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] text-white shadow-[0_8px_20px_rgba(108,170,216,0.4)]"
          : "bg-[#FFE3DC] text-[#EF6458] shadow-[0_6px_16px_rgba(239,100,88,0.22)]"
      }`}
      {...rest}
    >
      {isYay ? <CheckIcon /> : <XIcon />}
      <span className="mt-1 font-[family-name:var(--font-home-sans)] text-[9px] font-bold leading-none">
        {isYay ? "YES!" : "NAH"}
      </span>
    </button>
  );
}

function DisplayAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      aria-hidden
      className="grid h-8 w-8 place-items-center rounded-full bg-[#F0E4FA] font-[family-name:var(--font-home-serif)] text-[13px] font-bold text-[#7A4FAA]"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
