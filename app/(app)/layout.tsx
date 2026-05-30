import { AppNav } from "./_components/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <AppNav />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
