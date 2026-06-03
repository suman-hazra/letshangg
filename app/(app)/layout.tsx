import { createClient } from "@/lib/supabase/server";
import { AppNav } from "./_components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let matchCount = 0;
  if (user) {
    const { count } = await supabase
      .from("hangs")
      .select("id", { count: "exact", head: true })
      .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
      .eq("matched", true);
    matchCount = count ?? 0;
  }

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)]">
      <div className="pointer-events-none absolute left-1/2 -top-24 h-[380px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[340px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />
      <div className="relative z-10 h-11 shrink-0" />
      <AppNav matchCount={matchCount} />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
