import Link from "next/link";
import { redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { InviteCard } from "./client";

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  variable: "--font-invite-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-invite-sans",
});

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
    <main
      className={`${lora.variable} ${jakarta.variable} relative z-10 flex-1 px-5 pb-8 pt-5`}
    >
      <div className="mx-auto w-full max-w-[430px]">
        <Link
          href="/friends"
          className="mb-5 inline-flex items-center gap-1 font-[family-name:var(--font-invite-sans)] text-xs font-bold uppercase tracking-widest text-[#8CC0EB] transition active:opacity-60"
        >
          <ArrowLeftIcon />
          <span>Friends</span>
        </Link>

        <h1 className="font-[family-name:var(--font-invite-serif)] text-[30px] font-bold leading-tight text-[#2D3E4E]">
          Bring a friend.
        </h1>
        <p className="mb-7 mt-2 font-[family-name:var(--font-invite-sans)] text-[13px] leading-relaxed text-[#8A9CAB]">
          Share this link or have them scan the code. They&apos;ll be auto-added
          to your friends.
        </p>

        <InviteCard username={profile.username} displayName={displayName} />
      </div>
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
