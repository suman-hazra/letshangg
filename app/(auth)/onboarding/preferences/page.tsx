import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveVerdict } from "./actions";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // All curated preferences
  const { data: prefs, error: prefsError } = await supabase
    .from("preference_options")
    .select("id, label, activity_key, quiz_order")
    .eq("is_active", true)
    .order("quiz_order");

  if (prefsError || !prefs) {
    throw new Error(prefsError?.message ?? "could not load preferences");
  }

  // What has this user already voted on?
  const { data: voted } = await supabase
    .from("user_preferences")
    .select("preference_id")
    .eq("user_id", user.id);

  const votedIds = new Set((voted ?? []).map((v) => v.preference_id));
  const remaining = prefs.filter((p) => !votedIds.has(p.id));

  // All done — onboarding complete.
  if (remaining.length === 0) {
    redirect("/onboarding/finding-hangs");
  }

  const card = remaining[0];
  const completed = prefs.length - remaining.length;
  const total = prefs.length;
  const progressPct = ((completed + 0.5) / total) * 100;

  return (
    <main className="min-h-dvh flex flex-col items-center px-6 py-10">
      <div className="w-full max-w-[430px] flex flex-col flex-1">
        <p className="font-sans text-sm tracking-widest uppercase text-muted text-center">
          letshangg
        </p>

        {/* Progress bar */}
        <div className="mt-6 h-1 rounded-full bg-line overflow-hidden">
          <div
            className="h-full bg-ink transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="mt-2 font-sans text-xs text-muted text-center tabular-nums">
          {completed + 1} of {total}
        </p>

        {/* Card */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full rounded-2xl bg-surface border border-line px-8 py-12 text-center">
            <h1 className="font-serif text-3xl leading-tight text-ink">
              {card.label}
            </h1>
            <p className="mt-3 font-sans text-sm text-muted">
              yay, meh, or nay?
            </p>
          </div>

          {/* Verdict buttons */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <form action={saveVerdict}>
              <input type="hidden" name="preference_id" value={card.id} />
              <input type="hidden" name="verdict" value="yay" />
              <VerdictButton kind="yay" aria-label={`Yay to ${card.label}`} />
            </form>
            <form action={saveVerdict}>
              <input type="hidden" name="preference_id" value={card.id} />
              <input type="hidden" name="verdict" value="meh" />
              <VerdictButton kind="meh" aria-label={`Meh to ${card.label}`} />
            </form>
            <form action={saveVerdict}>
              <input type="hidden" name="preference_id" value={card.id} />
              <input type="hidden" name="verdict" value="nay" />
              <VerdictButton kind="nay" aria-label={`Nay to ${card.label}`} />
            </form>
          </div>

          <p className="mt-8 font-script text-lg text-muted">
            only mutual yeses become matches.
          </p>
        </div>
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
  return (
    <button
      type="submit"
      className={`h-16 w-16 rounded-full flex items-center justify-center font-sans text-xs font-black uppercase transition active:scale-95 ${
        isYay
          ? "bg-ink text-surface"
          : isMeh
            ? "bg-[#F8EBD6] text-[#C99352]"
            : "bg-surface border border-line text-ink"
      }`}
      {...rest}
    >
      {isYay ? "Yay" : isMeh ? "Meh" : "Nay"}
    </button>
  );
}
