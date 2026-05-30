import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { generateHangsForUser } from "@/lib/hang-manager";
import { swipeHang, refreshHangs } from "./actions";
import { Avatar } from "../_components/avatar";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

type HangRow = {
  id: string;
  user_a: string;
  user_b: string;
  preference_id: string;
  prompt_copy: string;
  created_at: string;
};

async function fetchPendingHang(
  supabase: SupabaseClient,
  userId: string,
): Promise<HangRow | null> {
  const [resultA, resultB] = await Promise.all([
    supabase
      .from("hangs")
      .select("id, user_a, user_b, preference_id, prompt_copy, created_at")
      .eq("user_a", userId)
      .is("swipe_a", null)
      .eq("matched", false)
      .order("created_at", { ascending: true })
      .limit(1),
    supabase
      .from("hangs")
      .select("id, user_a, user_b, preference_id, prompt_copy, created_at")
      .eq("user_b", userId)
      .is("swipe_b", null)
      .eq("matched", false)
      .order("created_at", { ascending: true })
      .limit(1),
  ]);

  const candidates = [
    ...(resultA.data ?? []),
    ...(resultB.data ?? []),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at));

  return candidates[0] ?? null;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
    return (
      <main className="flex-1 flex flex-col items-center px-6 pb-12">
        <div className="flex-1 flex items-center justify-center w-full max-w-[430px]">
          <div className="text-center">
            <h1 className="font-serif text-3xl text-ink leading-tight">
              You&apos;re all
              <br />
              caught up.
            </h1>
            <p className="mt-6 font-sans text-base text-muted">
              New hangs surface when you or a friend updates preferences.
            </p>
            <form action={refreshHangs} className="mt-8">
              <button
                type="submit"
                className="font-sans text-sm text-accent underline underline-offset-4"
              >
                Check for new hangs
              </button>
            </form>
          </div>
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
  const activityEmoji = prefRow?.emoji ?? "🤝";
  const activityLabel = prefRow?.label ?? "hang";

  return (
    <main className="flex-1 flex flex-col items-center px-6 pb-12">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-[430px]">
        {/* Card */}
        <div className="w-full rounded-2xl bg-surface border border-line px-8 py-12 text-center">
          <div className="flex justify-center">
            <Avatar name={friendName} url={friendAvatar} size="md" />
          </div>
          <p className="mt-3 font-sans text-sm text-muted">{friendName}</p>

          <div className="mt-6 text-5xl leading-none" aria-hidden>
            {activityEmoji}
          </div>

          <p className="mt-6 font-serif text-2xl leading-snug text-ink">
            {hang.prompt_copy}
          </p>
          <p className="sr-only">activity: {activityLabel}</p>
        </div>

        {/* Verdict buttons */}
        <div className="mt-8 flex items-center justify-center gap-6">
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

        <p className="mt-8 font-script text-lg text-muted">
          no one sees what you skip.
        </p>
      </div>
    </main>
  );
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
      className={`h-16 w-16 rounded-full flex items-center justify-center transition active:scale-95 ${
        isYay
          ? "bg-ink text-surface"
          : "bg-surface border border-line text-ink"
      }`}
      {...rest}
    >
      {isYay ? <CheckIcon /> : <XIcon />}
    </button>
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
      strokeWidth="2.5"
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
