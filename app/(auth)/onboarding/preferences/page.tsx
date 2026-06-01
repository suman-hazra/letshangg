import Image from "next/image";
import { redirect } from "next/navigation";
import { Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { saveVerdict } from "./actions";

const poppins = Poppins({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-quiz-heading",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-quiz-sans",
});

const QUIZ_IMAGE_BASE =
  "https://pdtdpyyzgjrslceuqkje.supabase.co/storage/v1/object/public/assets/quiz";

const QUIZ_IMAGES: Record<string, string> = {
  coffee: `${QUIZ_IMAGE_BASE}/coffee.jpg`,
  pizza: `${QUIZ_IMAGE_BASE}/pizza.jpg`,
  movie: `${QUIZ_IMAGE_BASE}/movie.jpg`,
  drinks: `${QUIZ_IMAGE_BASE}/drinks.jpg`,
  house_party: `${QUIZ_IMAGE_BASE}/house_party.jpg`,
  dancing: `${QUIZ_IMAGE_BASE}/dancing.jpg`,
  workout: `${QUIZ_IMAGE_BASE}/workout.jpg`,
  bike: `${QUIZ_IMAGE_BASE}/bike.jpg`,
  pickup_sport: `${QUIZ_IMAGE_BASE}/pickup_sport.jpg`,
  rock_climbing: `${QUIZ_IMAGE_BASE}/rock_climbing.jpg`,
  hike: `${QUIZ_IMAGE_BASE}/hike.jpg`,
  park: `${QUIZ_IMAGE_BASE}/park.jpg`,
  sunset_walk: `${QUIZ_IMAGE_BASE}/sunset_walk.jpg`,
  beach: `${QUIZ_IMAGE_BASE}/beach.jpg`,
  show: `${QUIZ_IMAGE_BASE}/show.jpg`,
  museum: `${QUIZ_IMAGE_BASE}/museum.jpg`,
  bookstore: `${QUIZ_IMAGE_BASE}/bookstore.jpg`,
  theater_comedy: `${QUIZ_IMAGE_BASE}/theater_comedy.jpg`,
  cooking: `${QUIZ_IMAGE_BASE}/cooking.jpg`,
  pottery_class: `${QUIZ_IMAGE_BASE}/pottery_class.jpg`,
  thrift: `${QUIZ_IMAGE_BASE}/thrift.jpg`,
  bowling: `${QUIZ_IMAGE_BASE}/bowling.jpg`,
  game_night: `${QUIZ_IMAGE_BASE}/game_night.jpg`,
  arcade_mini_golf: `${QUIZ_IMAGE_BASE}/arcade_mini_golf.jpg`,
  ice_cream: `${QUIZ_IMAGE_BASE}/ice_cream.jpg`,
  restaurant: `${QUIZ_IMAGE_BASE}/restaurant.jpg`,
  self_care: `${QUIZ_IMAGE_BASE}/self_care.jpg`,
  day_trip: `${QUIZ_IMAGE_BASE}/day_trip.jpg`,
  escape_room: `${QUIZ_IMAGE_BASE}/escape_room.jpg`,
  festival: `${QUIZ_IMAGE_BASE}/festival.jpg`,
};

const PREVIEW_ACTIVITIES = [
  "Grab coffee",
  "Get pizza",
  "Watch a movie",
  "Grab drinks",
  "Go to a house party / get-together",
  "Go dancing / night out",
  "Take a workout class",
  "Bike ride",
  "Play a pickup sport",
  "Go rock climbing",
  "Go for a hike",
  "Hang at the park",
  "Sunset walk",
  "Beach / waterfront day",
  "Catch a live show",
  "Visit a museum",
  "Bookstore browse",
  "See theater / comedy",
  "Cook a meal together",
  "Take an art / pottery class",
  "Go thrifting",
  "Go bowling",
  "Game night",
  "Arcade / mini-golf",
  "Ice cream run",
  "Try a new restaurant",
  "Spa / self-care day",
  "Day trip / road trip",
  "Escape room",
  "Festival / street fair",
];

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const isPreview = process.env.NODE_ENV !== "production" && preview === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user && !isPreview) redirect("/login");

  const previewPrefs = PREVIEW_ACTIVITIES.map((label, index) => ({
    id: `preview-${index + 1}`,
    label,
    activity_key: `preview_${index + 1}`,
    quiz_order: index + 1,
  }));

  // All curated preferences
  const { data: prefs, error: prefsError } = user
    ? await supabase
        .from("preference_options")
        .select("id, label, activity_key, quiz_order")
        .eq("is_active", true)
        .order("quiz_order")
    : { data: previewPrefs, error: null };

  if (prefsError || !prefs) {
    throw new Error(prefsError?.message ?? "could not load preferences");
  }

  // What has this user already voted on?
  const { data: voted } = user
    ? await supabase
        .from("user_preferences")
        .select("preference_id")
        .eq("user_id", user.id)
    : { data: [] };

  const orderedPrefs = getUserQuizOrder(prefs, user?.id ?? "preview-user");
  const votedIds = new Set((voted ?? []).map((v) => v.preference_id));
  const remaining = orderedPrefs.filter((p) => !votedIds.has(p.id));

  // All done — onboarding complete.
  if (remaining.length === 0) {
    redirect("/onboarding/finding-hangs");
  }

  const card = remaining[0];
  const completed = orderedPrefs.length - remaining.length;
  const total = orderedPrefs.length;
  const progressPct = ((completed + 1) / total) * 100;
  const activityImage = QUIZ_IMAGES[card.activity_key];

  return (
    <main
      className={`${poppins.variable} ${jakarta.variable} fixed inset-0 w-full overflow-hidden`}
      style={{
        minHeight: "100vh",
        height: "100dvh",
        background: activityImage
          ? undefined
          : "linear-gradient(165deg, #7FCCF6 0%, #43AEEA 38%, #1E8FD2 72%, #0D6BA8 100%)",
      }}
    >
      {activityImage && (
        <Image
          src={activityImage}
          alt=""
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      )}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(13,40,62,0.28) 0%, transparent 24%, transparent 58%, rgba(13,40,62,0.28) 100%)",
        }}
      />

      <div className="absolute inset-x-0 top-0 px-6 pt-10">
        <div className="flex justify-end">
          <div className="rounded-full bg-white/20 px-3 py-1 font-[family-name:var(--font-quiz-sans)] text-xs font-bold tracking-wide text-white backdrop-blur-md">
            {completed + 1} of {total}
          </div>
        </div>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white/90 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {!activityImage && (
        <div className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/15 px-4 py-2 font-[family-name:var(--font-quiz-sans)] text-[10.5px] font-bold uppercase tracking-[0.14em] text-white/75 backdrop-blur-md">
          Activity photo
        </div>
      )}

      <div className="absolute bottom-[194px] left-1/2 max-w-[calc(100%-56px)] -translate-x-1/2 rounded-full border border-white/60 bg-white/85 px-7 py-3.5 text-center shadow-[0_14px_34px_-12px_rgba(13,40,62,0.45)] backdrop-blur-xl">
        <h1 className="whitespace-nowrap font-[family-name:var(--font-quiz-heading)] text-[21px] font-extrabold leading-tight tracking-[-0.02em] text-[#15293A]">
          {card.label}
        </h1>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center gap-7 px-5 pb-9">
        <form action={saveVerdict}>
          <input type="hidden" name="preference_id" value={card.id} />
          <input type="hidden" name="verdict" value="nay" />
          <VerdictButton kind="nay" aria-label={`Nay to ${card.label}`} />
        </form>
        <form action={saveVerdict}>
          <input type="hidden" name="preference_id" value={card.id} />
          <input type="hidden" name="verdict" value="meh" />
          <VerdictButton kind="meh" aria-label={`Meh to ${card.label}`} />
        </form>
        <form action={saveVerdict}>
          <input type="hidden" name="preference_id" value={card.id} />
          <input type="hidden" name="verdict" value="yay" />
          <VerdictButton kind="yay" aria-label={`Yay to ${card.label}`} />
        </form>
      </div>
    </main>
  );
}

function VerdictButton({
  kind,
  ...rest
}: {
  kind: "yay" | "meh" | "nay";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const isYay = kind === "yay";
  const isMeh = kind === "meh";
  const label = isYay ? "Yay" : isMeh ? "Meh" : "Nay";
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="submit"
        className={`grid rounded-full transition active:scale-95 ${
          isYay
            ? "size-[76px] place-items-center bg-[linear-gradient(135deg,#8CC0EB_0%,#5AAEE0_100%)] text-white shadow-[0_16px_34px_-8px_rgba(13,40,62,0.6)]"
            : "size-[60px] place-items-center bg-white text-[#7A96A8] shadow-[0_12px_28px_-8px_rgba(13,40,62,0.55)]"
        }`}
        {...rest}
      >
        {isYay ? (
          <ThumbsUpIcon size={30} />
        ) : isMeh ? (
          <MehIcon />
        ) : (
          <ThumbsDownIcon />
        )}
      </button>
      <span className="font-[family-name:var(--font-quiz-sans)] text-[11.5px] font-bold leading-none text-white [text-shadow:0_1px_6px_rgba(13,40,62,0.5)]">
        {label}
      </span>
    </div>
  );
}

function getUserQuizOrder<T extends { id: string; quiz_order: number | null }>(
  prefs: T[],
  userId: string,
): T[] {
  return [...prefs].sort((a, b) => {
    const rankA = hashString(`${userId}:${a.id}`);
    const rankB = hashString(`${userId}:${b.id}`);
    if (rankA !== rankB) return rankA - rankB;
    return (a.quiz_order ?? 0) - (b.quiz_order ?? 0);
  });
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function ThumbsUpIcon({ size = 23 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}

function ThumbsDownIcon() {
  return (
    <span className="text-[#C0956A]">
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M17 14V2" />
        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
      </svg>
    </span>
  );
}

function MehIcon() {
  return (
    <span className="text-[#7A96A8]">
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="8" y1="15" x2="16" y2="15" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    </span>
  );
}
