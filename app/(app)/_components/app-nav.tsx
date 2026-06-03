"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS: {
  href: string;
  label: string;
  icon: (props: IconProps) => ReactNode;
  match: (p: string) => boolean;
  badge?: number;
}[] = [
  {
    href: "/home",
    label: "Home",
    icon: HomeIcon,
    match: (p) => p === "/home" || p.startsWith("/match"),
  },
  {
    href: "/friends",
    label: "Friends",
    icon: FriendsIcon,
    match: (p) => p.startsWith("/friends"),
  },
  {
    href: "/profile",
    label: "You",
    icon: UserIcon,
    match: (p) => p.startsWith("/profile"),
  },
];

export function AppNav({ matchCount }: { matchCount: number }) {
  const pathname = usePathname();

  // Hide nav on the match screen itself — that screen is the moment, no chrome.
  if (pathname.startsWith("/match/")) return null;

  return (
    <header className="relative z-10 h-[58px] w-full shrink-0 border-b border-[rgba(140,192,235,0.22)] bg-white/55 backdrop-blur-2xl">
      <div className="mx-auto flex h-full w-full max-w-[430px] items-center px-6">
        <Link
          href="/home"
          className="relative h-8 w-[57px] shrink-0 overflow-hidden opacity-90 transition active:opacity-60"
          aria-label="letshangg home"
        >
          <Image
            src="/logo-mark.png"
            alt="letshangg"
            fill
            sizes="57px"
            draggable={false}
            className="select-none object-contain"
            priority
          />
        </Link>
        <div className="flex-1" />
        <nav className="flex items-center gap-1" aria-label="Primary">
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            const badge = tab.href === "/friends" && matchCount > 0 ? matchCount : 0;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`relative flex h-12 min-w-12 flex-col items-center justify-center rounded-xl px-2 font-sans text-[10px] font-bold tracking-[0.04em] transition active:opacity-60 ${
                  active
                    ? "bg-[rgba(140,192,235,0.1)] text-[#8CC0EB]"
                    : "text-[#9AACBA]"
                }`}
              >
                <span className="relative">
                  <Icon size={20} strokeWidth={2} />
                  {badge > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#E8855A] px-1 font-sans text-[9px] font-bold leading-none text-white">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </span>
                <span className="mt-0.5">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mx-2 h-6 w-px shrink-0 bg-[rgba(140,192,235,0.3)]" />
        <button
          type="button"
          aria-label="Open menu"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#4A6173] transition active:opacity-60"
        >
          <MenuIcon size={22} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}

type IconProps = {
  size: number;
  strokeWidth: number;
};

function HomeIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function FriendsIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MenuIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}
