import Link from "next/link";
import { redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { userHasDemoFriends } from "@/lib/demo";
import { removeDemoFriends, saveDisplayName, signOut } from "./actions";
import { AvatarEditor, DeleteProfileForm } from "./client";

const lora = Lora({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-you-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-you-sans",
});

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/profile");

  const hasDemoFriends = await userHasDemoFriends(user.id);

  return (
    <main
      className={`${lora.variable} ${jakarta.variable} relative z-10 flex-1 overflow-y-auto px-5 pb-8 pt-6`}
    >
      <div className="mx-auto w-full max-w-[430px]">
        <h1 className="font-[family-name:var(--font-you-serif)] text-[30px] font-bold leading-none tracking-tight text-[#2D3E4E]">
          You.
        </h1>
        <p className="mt-1 font-[family-name:var(--font-you-sans)] text-[13px] text-[#8A9CAB]">
          Photo, name, what you&apos;re up for.
        </p>

        {saved === "name" && (
          <p className="mt-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-you-sans)] text-sm text-[#2D3E4E] backdrop-blur-md">
            Display name saved.
          </p>
        )}
        {saved === "demo-removed" && (
          <p className="mt-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-you-sans)] text-sm text-[#2D3E4E] backdrop-blur-md">
            Demo friends removed, along with their hangs and chats.
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-you-sans)] text-sm text-danger backdrop-blur-md">
            {decodeURIComponent(error)}
          </p>
        )}

        <div className="mb-8 mt-8 flex flex-col items-center">
          <AvatarEditor
            initialUrl={profile.avatar_url}
            initial={
              (profile.display_name ?? profile.username ?? "?")
                .charAt(0)
                .toUpperCase()
            }
          />
        </div>

        <section>
          <h2 className="mb-2 font-[family-name:var(--font-you-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AACBA]">
            Identity
          </h2>

          <div className="mb-5 overflow-hidden rounded-2xl border border-white/70 bg-white/60 backdrop-blur-md">
            <div className="flex items-center border-b border-[rgba(140,192,235,0.14)] px-4 py-3">
              <span className="w-[92px] shrink-0 font-[family-name:var(--font-you-sans)] text-xs font-semibold uppercase text-[#9AACBA]">
                Username
              </span>
              <span className="font-[family-name:var(--font-you-sans)] text-sm font-bold text-[#2D3E4E]">
                @{profile.username}
              </span>
              <span className="ml-3 rounded-full bg-[rgba(140,192,235,0.15)] px-2 py-[2px] font-[family-name:var(--font-you-sans)] text-[10px] font-semibold uppercase text-[#6FA8CC]">
                permanent
              </span>
            </div>

            <form action={saveDisplayName} className="px-4 pb-4 pt-3">
              <label className="block">
                <span className="font-[family-name:var(--font-you-sans)] text-xs font-semibold uppercase text-[#9AACBA]">
                  Display name
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    name="display_name"
                    type="text"
                    defaultValue={profile.display_name ?? ""}
                    required
                    maxLength={40}
                    className="min-w-0 flex-1 rounded-xl border-[1.5px] border-[rgba(140,192,235,0.35)] bg-white/80 px-3 py-[10px] font-[family-name:var(--font-you-sans)] text-sm font-medium text-[#2D3E4E] focus:outline-none focus:border-[#8CC0EB]"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-[linear-gradient(135deg,#8CC0EB_0%,#6AAAD8_100%)] px-4 py-[10px] font-[family-name:var(--font-you-sans)] text-[13px] font-bold text-white shadow-sm transition active:opacity-70"
                  >
                    Save
                  </button>
                </div>
              </label>
            </form>
          </div>
        </section>

        <section>
          <h2 className="mb-2 font-[family-name:var(--font-you-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AACBA]">
            Preferences
          </h2>
          <Link
            href="/profile/preferences"
            className="mb-5 flex w-full items-center rounded-2xl border border-white/70 bg-white/60 px-4 py-4 text-left backdrop-blur-md transition active:opacity-70"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-[family-name:var(--font-you-sans)] text-sm font-bold text-[#2D3E4E]">
                Edit what you&apos;re into
              </span>
              <span className="mt-0.5 block font-[family-name:var(--font-you-sans)] text-xs leading-relaxed text-[#8A9CAB]">
                Add or change your hang preferences. New YAYs surface new
                hangs.
              </span>
            </span>
            <ChevronRightIcon />
          </Link>
        </section>

        <section>
          <h2 className="mb-2 font-[family-name:var(--font-you-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AACBA]">
            Account
          </h2>
          <div className="mb-3 overflow-hidden rounded-2xl border border-white/70 bg-white/60 backdrop-blur-md">
            {hasDemoFriends && (
              <form action={removeDemoFriends}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 border-b border-[rgba(140,192,235,0.14)] px-4 py-4 text-left transition active:opacity-70"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(140,192,235,0.14)] text-[#5A8FAA]">
                    <SparkleOffIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-[family-name:var(--font-you-sans)] text-sm font-semibold text-[#2D3E4E]">
                      Remove demo friends
                    </span>
                    <span className="mt-0.5 block font-[family-name:var(--font-you-sans)] text-xs text-[#8A9CAB]">
                      Clears Maya, Dustin, Priya and your hangs with them.
                    </span>
                  </span>
                </button>
              </form>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 border-b border-[rgba(140,192,235,0.14)] px-4 py-4 text-left transition active:opacity-70"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(140,192,235,0.14)] text-[#5A8FAA]">
                  <LogOutIcon />
                </span>
                <span className="font-[family-name:var(--font-you-sans)] text-sm font-semibold text-[#2D3E4E]">
                  Sign out
                </span>
              </button>
            </form>
            <DeleteProfileForm />
          </div>
          <p className="text-center font-[family-name:var(--font-you-sans)] text-[11px] text-[#B0BEC8]">
            Deleting your account is irreversible.
          </p>
        </section>
      </div>
    </main>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8CC0EB"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="ml-2 shrink-0"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function SparkleOffIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.94 5.31 12 1l2.06 4.31L18 7.5l-3.94 2.19L12 14l-2.06-4.31L6 7.5l3.94-2.19Z" />
      <path d="M19 14v6" />
      <path d="M22 17h-6" />
      <path d="M5 17v4" />
      <path d="M7 19H3" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
