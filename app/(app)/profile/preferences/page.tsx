import Link from "next/link";
import { redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { HangPreferencesForm } from "./client";

const lora = Lora({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-hang-prefs-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-hang-prefs-sans",
});

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
    <main
      className={`${lora.variable} ${jakarta.variable} relative z-10 flex min-h-0 flex-1 flex-col`}
    >
      <div className="border-b border-[rgba(140,192,235,0.14)] px-5 pb-4 pt-4">
        <div className="mx-auto w-full max-w-[430px]">
          <Link
            href="/profile"
            className="mb-4 flex items-center gap-1 font-[family-name:var(--font-hang-prefs-sans)] text-xs font-bold uppercase tracking-widest text-[#8CC0EB] transition active:opacity-60"
          >
            <ArrowLeftIcon />
            Profile
          </Link>

          <h1 className="font-[family-name:var(--font-hang-prefs-serif)] text-[26px] font-bold leading-tight text-[#2D3E4E]">
            What are you up for?
          </h1>
          <p className="mt-2 font-[family-name:var(--font-hang-prefs-sans)] text-[13px] leading-relaxed text-[#8A9CAB]">
            Tap to switch a YAY to a NAY or vice versa.{" "}
            <span className="text-[#6AAAD8]">New YAYs</span> find new hangs
            with your friends.
          </p>
        </div>
      </div>

      <HangPreferencesForm
        preferences={(prefs ?? []).map((preference) => ({
          id: preference.id,
          label: preference.label,
          activity_key: preference.activity_key,
          verdict:
            (verdictByPref.get(preference.id) as "yay" | "meh" | "nay") ??
            "nay",
        }))}
      />
    </main>
  );
}

function ArrowLeftIcon() {
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
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}
