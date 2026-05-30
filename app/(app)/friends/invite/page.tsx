import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteCard } from "./client";

export default async function InvitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.username) redirect("/onboarding/profile");

  const displayName = profile.display_name ?? profile.username;

  return (
    <main className="flex-1 flex flex-col items-center px-6 pb-12">
      <div className="w-full max-w-[430px]">
        <Link
          href="/friends"
          className="font-sans text-xs tracking-widest uppercase text-muted"
        >
          ← Friends
        </Link>

        <h1 className="mt-6 font-serif text-3xl text-ink leading-tight">
          Bring a friend.
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Share this link or have them scan the code. They&apos;ll be auto-added
          to your friends.
        </p>

        <InviteCard username={profile.username} displayName={displayName} />

        <p className="mt-10 font-script text-lg text-muted text-center">
          no awkward intros.
        </p>
      </div>
    </main>
  );
}
