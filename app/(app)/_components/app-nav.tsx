"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS: { href: string; label: string; match: (p: string) => boolean }[] = [
  { href: "/home", label: "Home", match: (p) => p === "/home" || p.startsWith("/match") },
  { href: "/friends", label: "Friends", match: (p) => p.startsWith("/friends") },
  { href: "/profile", label: "You", match: (p) => p.startsWith("/profile") },
];

export function AppNav() {
  const pathname = usePathname();

  // Hide nav on the match screen itself — that screen is the moment, no chrome.
  if (pathname.startsWith("/match/")) return null;

  return (
    <header className="w-full px-6 pt-5 pb-3 max-w-[430px] mx-auto flex items-center justify-between">
      <Link
        href="/home"
        className="font-sans text-xs tracking-widest uppercase text-muted"
      >
        letshangg
      </Link>
      <nav className="flex items-center gap-5">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`font-sans text-xs tracking-widest uppercase transition ${
                active ? "text-ink font-semibold" : "text-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
