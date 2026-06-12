"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { signOut } from "@/app/(app)/profile/actions";

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

const MENU_LINKS: {
  href: string;
  label: string;
  icon: (props: IconProps) => ReactNode;
  tileClassName: string;
  iconClassName: string;
  labelClassName: string;
}[] = [
  {
    href: "/about",
    label: "About Letshangg",
    icon: InfoIcon,
    tileClassName: "bg-[rgba(180,200,215,0.12)]",
    iconClassName: "text-[#6A8EA0]",
    labelClassName: "text-[#2D3E4E]",
  },
  {
    href: "/contribute",
    label: "Contribute",
    icon: HeartIcon,
    tileClassName: "bg-[rgba(140,192,235,0.15)]",
    iconClassName: "text-[#6AAAD8]",
    labelClassName: "text-[#4A8EC0]",
  },
  {
    href: "/privacy",
    label: "Privacy",
    icon: ShieldIcon,
    tileClassName: "bg-[rgba(180,200,215,0.12)]",
    iconClassName: "text-[#6A8EA0]",
    labelClassName: "text-[#2D3E4E]",
  },
  {
    href: "/terms",
    label: "Terms",
    icon: FileTextIcon,
    tileClassName: "bg-[rgba(180,200,215,0.12)]",
    iconClassName: "text-[#6A8EA0]",
    labelClassName: "text-[#2D3E4E]",
  },
];

export function AppNav({ friendsBadgeCount }: { friendsBadgeCount: number }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Hide nav on moment screens — match and friended confirmation.
  if (pathname.startsWith("/match/") || pathname === "/friends/friended") return null;

  return (
    <header
      className={`relative h-[58px] w-full shrink-0 border-b border-[rgba(140,192,235,0.22)] bg-white/55 backdrop-blur-2xl ${
        isMenuOpen ? "z-50" : "z-10"
      }`}
    >
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
            const badge =
              tab.href === "/friends" && friendsBadgeCount > 0
                ? friendsBadgeCount
                : 0;
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
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="app-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          className={`relative z-40 grid h-10 w-10 shrink-0 place-items-center rounded-xl transition active:opacity-60 ${
            isMenuOpen
              ? "bg-[rgba(140,192,235,0.15)] text-[#4A6173]"
              : "text-[#4A6173]"
          }`}
        >
          {isMenuOpen ? (
            <CloseIcon size={20} strokeWidth={2} />
          ) : (
            <MenuIcon size={22} strokeWidth={2} />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-20 bg-[rgba(21,41,58,0.18)] backdrop-blur-[2px]"
            onClick={() => setIsMenuOpen(false)}
          />
          <div
            id="app-menu"
            className="fixed right-[max(16px,calc((100vw-430px)/2+16px))] top-[113px] z-30 w-[260px] rounded-[22px] border border-white bg-white shadow-[0_20px_56px_rgba(44,62,78,0.18),inset_0_1px_0_rgba(255,255,255,0.8)]"
          >
            <nav aria-label="Menu" className="px-3 py-1">
              {MENU_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center rounded-[14px] px-3 py-2.5 font-[family-name:var(--font-friends-sans)] transition active:bg-[rgba(140,192,235,0.12)]"
                  >
                    <span
                      className={`grid size-8 shrink-0 place-items-center rounded-[10px] ${link.tileClassName} ${link.iconClassName}`}
                    >
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span
                      className={`ml-3 min-w-0 flex-1 truncate text-[14px] font-semibold ${link.labelClassName}`}
                    >
                      {link.label}
                    </span>
                    <ChevronRightIcon size={14} strokeWidth={2.5} />
                  </Link>
                );
              })}
            </nav>

            <form action={signOut} className="px-3 pb-3 pt-1">
              <button
                type="submit"
                className="flex w-full items-center rounded-[14px] px-3 py-2.5 text-left font-[family-name:var(--font-friends-sans)] transition active:bg-[rgba(208,96,96,0.08)]"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-[rgba(208,96,96,0.10)] text-[#D06060]">
                  <LogOutIcon size={15} strokeWidth={2} />
                </span>
                <span className="ml-3 min-w-0 flex-1 truncate text-[14px] font-semibold text-[#D06060]">
                  Sign out
                </span>
              </button>
            </form>
          </div>
        </>
      )}
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

function CloseIcon({ size, strokeWidth }: IconProps) {
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
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function InfoIcon({ size, strokeWidth }: IconProps) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function HeartIcon({ size, strokeWidth }: IconProps) {
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
      <path d="M19 14c1.5-1.5 3-3.4 3-5.5A5.5 5.5 0 0 0 12 5a5.5 5.5 0 0 0-10 3.5c0 2.1 1.5 4 3 5.5l7 7Z" />
    </svg>
  );
}

function ShieldIcon({ size, strokeWidth }: IconProps) {
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
      <path d="M20 13c0 5-3.5 7.5-7.7 8.9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1Z" />
    </svg>
  );
}

function FileTextIcon({ size, strokeWidth }: IconProps) {
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
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </svg>
  );
}

function ChevronRightIcon({ size, strokeWidth }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#C4D4DE"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="shrink-0"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function LogOutIcon({ size, strokeWidth }: IconProps) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
