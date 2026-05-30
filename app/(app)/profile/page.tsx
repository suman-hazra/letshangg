import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveDisplayName, signOut } from "./actions";
import { AvatarEditor } from "./client";

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

  return (
    <main className="flex-1 flex flex-col items-center px-6 pb-12">
      <div className="w-full max-w-[430px]">
        <h1 className="mt-4 font-serif text-3xl text-ink leading-tight">
          You.
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Photo, name, what you&apos;re up for.
        </p>

        {saved === "name" && (
          <p className="mt-4 font-sans text-sm text-ink bg-accent-soft rounded-2xl px-4 py-3">
            Display name saved.
          </p>
        )}
        {error && (
          <p className="mt-4 font-sans text-sm text-danger bg-surface border border-line rounded-2xl px-4 py-3">
            {decodeURIComponent(error)}
          </p>
        )}

        {/* Avatar editor (client island) */}
        <div className="mt-8 flex flex-col items-center">
          <AvatarEditor
            userId={user.id}
            initialUrl={profile.avatar_url}
            initial={
              (profile.display_name ?? profile.username ?? "?")
                .charAt(0)
                .toUpperCase()
            }
          />
        </div>

        {/* Identity */}
        <section className="mt-10">
          <h2 className="font-sans text-xs tracking-widest uppercase text-muted">
            Identity
          </h2>

          <div className="mt-3 rounded-2xl bg-surface border border-line px-4 py-3 space-y-3">
            <p className="font-sans text-xs text-muted">
              Username
              <span className="ml-2 font-sans text-sm font-semibold text-ink">
                @{profile.username}
              </span>
              <span className="ml-2 font-sans text-[10px] text-muted">
                permanent
              </span>
            </p>

            <form action={saveDisplayName} className="pt-1">
              <label className="block">
                <span className="font-sans text-xs text-muted">
                  Display name
                </span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    name="display_name"
                    type="text"
                    defaultValue={profile.display_name ?? ""}
                    required
                    maxLength={40}
                    className="flex-1 h-11 px-3 rounded-xl bg-background border border-line font-sans text-sm text-ink focus:outline-none focus:border-ink"
                  />
                  <button
                    type="submit"
                    className="h-11 px-4 rounded-full bg-ink text-surface font-sans text-xs font-semibold transition hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </label>
            </form>
          </div>
        </section>

        {/* Preferences */}
        <section className="mt-10">
          <h2 className="font-sans text-xs tracking-widest uppercase text-muted">
            Preferences
          </h2>
          <Link
            href="/profile/preferences"
            className="mt-3 block rounded-2xl bg-surface border border-line px-4 py-4 hover:bg-accent-soft transition"
          >
            <p className="font-sans text-sm font-semibold text-ink">
              Edit what you&apos;re into
            </p>
            <p className="mt-0.5 font-sans text-xs text-muted">
              Add or change your hang preferences. New YAYs surface new hangs
              with your friends.
            </p>
          </Link>
        </section>

        {/* Account */}
        <section className="mt-10">
          <h2 className="font-sans text-xs tracking-widest uppercase text-muted">
            Account
          </h2>
          <form action={signOut} className="mt-3">
            <button
              type="submit"
              className="w-full h-12 rounded-2xl bg-surface border border-line text-ink font-sans text-sm font-semibold transition hover:bg-accent-soft"
            >
              Sign out
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
