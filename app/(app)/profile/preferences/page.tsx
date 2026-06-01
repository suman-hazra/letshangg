import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { togglePreference } from "../actions";

export default async function EditPreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: prefs }, { data: votes }] = await Promise.all([
    supabase
      .from("preference_options")
      .select("id, label, activity_key, quiz_order")
      .eq("is_active", true)
      .order("quiz_order", { ascending: true }),
    supabase
      .from("user_preferences")
      .select("preference_id, verdict")
      .eq("user_id", user.id),
  ]);

  const verdictByPref = new Map(
    (votes ?? []).map((v) => [v.preference_id, v.verdict]),
  );

  return (
    <main className="flex-1 flex flex-col items-center px-6 pb-12">
      <div className="w-full max-w-[430px]">
        <Link
          href="/profile"
          className="font-sans text-xs tracking-widest uppercase text-muted"
        >
          ← Profile
        </Link>

        <h1 className="mt-6 font-serif text-3xl text-ink leading-tight">
          What are you up for?
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Tap to switch a YAY to a NAY or vice versa. New YAYs find new hangs
          with your friends.
        </p>

        <ul className="mt-8 space-y-3">
          {(prefs ?? []).map((p) => {
            const v = verdictByPref.get(p.id) ?? "nay";
            return (
              <li
                key={p.id}
                className="rounded-2xl bg-surface border border-line px-4 py-3 flex items-center gap-3"
              >
                <p className="flex-1 font-sans text-sm font-semibold text-ink truncate">
                  {p.label}
                </p>
                <div className="flex items-center gap-1 rounded-full border border-line bg-background p-1">
                  {(["yay", "meh", "nay"] as const).map((verdict) => (
                    <form action={togglePreference} key={verdict}>
                      <input
                        type="hidden"
                        name="preference_id"
                        value={p.id}
                      />
                      <input
                        type="hidden"
                        name="new_verdict"
                        value={verdict}
                      />
                      <button
                        type="submit"
                        aria-label={`Set ${p.label} to ${verdict}`}
                        className={`h-7 px-3 rounded-full font-sans text-[10px] font-black uppercase transition ${
                          v === verdict
                            ? "bg-ink text-surface"
                            : "text-muted"
                        }`}
                      >
                        {verdict}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-10 font-script text-lg text-muted text-center">
          no one sees what you skip.
        </p>
      </div>
    </main>
  );
}
