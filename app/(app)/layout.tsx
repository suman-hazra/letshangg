import { AppNav } from "./_components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)]">
      <div className="pointer-events-none absolute left-1/2 -top-24 h-[380px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[340px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />
      <div className="relative z-10 h-11 shrink-0" />
      <AppNav />
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
