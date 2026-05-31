"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

const EXEMPT = ["/about", "/contribute", "/terms", "/privacy"];

export function DesktopGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isDesktop, setIsDesktop] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const isExempt = EXEMPT.some((p) => pathname.startsWith(p));

  if (!mounted || !isDesktop || isExempt) return <>{children}</>;

  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)]">
      {/* Blobs */}
      <div className="pointer-events-none fixed left-1/2 -top-24 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none fixed left-1/2 bottom-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        {/* Logo */}
        <div className="relative h-[80px] w-[224px] overflow-hidden">
          <Image
            src="https://pdtdpyyzgjrslceuqkje.supabase.co/storage/v1/object/public/assets/logo.png"
            alt="letshangg"
            width={1536}
            height={1024}
            priority
            className="absolute left-1/2 top-0 h-auto w-[224px] max-w-none -translate-x-1/2 -translate-y-[34px] drop-shadow-sm"
          />
        </div>

        <h1 className="mt-8 max-w-md text-4xl font-extrabold leading-[1.1] tracking-tight text-[#15293A]">
          letshangg is a mobile experience.
        </h1>

        <p className="mt-5 max-w-sm text-[16px] font-medium leading-relaxed text-[#4A6173]">
          Open it on your phone to start making plans with friends. It&apos;s
          built for thumbs, not trackpads.
        </p>

        <div className="mt-8 flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-[15px] font-semibold text-[#15293A] shadow-sm backdrop-blur-sm">
          <span className="text-xl">📱</span>
          <span>Visit <span className="text-[#E8855A]">letshangg.app</span> on your phone</span>
        </div>
      </div>

      {/* Footer nav */}
      <footer className="relative pb-10 pt-6 text-center">
        <nav className="flex items-center justify-center gap-6 text-[13.5px] font-medium text-[#7A7570]">
          <Link href="/about" className="hover:text-[#1A1714] transition-colors">About</Link>
          <span className="text-[#E8E4DF]">·</span>
          <Link href="/contribute" className="hover:text-[#1A1714] transition-colors">Contribute</Link>
          <span className="text-[#E8E4DF]">·</span>
          <Link href="/terms" className="hover:text-[#1A1714] transition-colors">Terms</Link>
          <span className="text-[#E8E4DF]">·</span>
          <Link href="/privacy" className="hover:text-[#1A1714] transition-colors">Privacy</Link>
        </nav>
      </footer>
    </div>
  );
}
