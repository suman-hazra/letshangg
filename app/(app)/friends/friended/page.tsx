import { Lora, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["800"],
  variable: "--font-friended-poppins",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "800"],
  variable: "--font-friended-jakarta",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-friended-lora",
});

export default async function FriendedPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; avatar?: string }>;
}) {
  const { name, avatar } = await searchParams;
  const friendName = name ? decodeURIComponent(name) : "your friend";
  const avatarUrl = avatar ? decodeURIComponent(avatar) : null;
  const initial = friendName.charAt(0).toUpperCase();

  return (
    <div
      className={`${poppins.variable} ${jakarta.variable} ${lora.variable} flex flex-1 flex-col`}
    >
      {/* Logo-only top bar */}
      <header className="flex h-[58px] shrink-0 items-center border-b border-[rgba(140,192,235,0.22)] bg-white/55 px-5 backdrop-blur-2xl">
        <Link
          href="/home"
          className="relative h-8 w-[57px] opacity-90 transition active:opacity-60"
          aria-label="letshangg home"
        >
          <Image
            src="/logo-mark.png"
            alt="letshangg"
            fill
            sizes="57px"
            className="object-contain"
            priority
          />
        </Link>
      </header>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-between px-7 pb-12 pt-10">
        {/* Top zone — badge + avatar + headline + subtext */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          {/* FRIENDED badge */}
          <div className="mb-8 flex items-center gap-2">
            <span className="h-[10px] w-[10px] rounded-full bg-[#6AAAD8] shadow-[0_0_0_3px_rgba(106,170,216,0.22)]" />
            <span className="font-[family-name:var(--font-friended-jakarta)] text-[11px] font-bold uppercase tracking-[0.18em] text-[#6AAAD8]">
              Friended
            </span>
          </div>

          {/* Avatar */}
          <div className="mb-6">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-[90px] w-[90px] rounded-full border-[3.5px] border-white/90 object-cover shadow-[0_8px_28px_rgba(44,62,78,0.12)]"
              />
            ) : (
              <span className="flex h-[90px] w-[90px] items-center justify-center rounded-full border-[3.5px] border-white/90 bg-[#DCEEFA] font-[family-name:var(--font-friended-lora)] text-[36px] font-bold text-[#4A7FA5] shadow-[0_8px_28px_rgba(44,62,78,0.12)]">
                {initial}
              </span>
            )}
          </div>

          {/* Headline */}
          <h1 className="mb-4 max-w-[300px] font-[family-name:var(--font-friended-poppins)] text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#15293A]">
            You&apos;re now friends with {friendName}.
          </h1>

          {/* Subtext */}
          <p className="max-w-[300px] font-[family-name:var(--font-friended-jakarta)] text-[15px] font-medium leading-relaxed text-[#5C7A8A]">
            If you&apos;ve both picked overlapping hang preferences, suggestions
            will start showing up on your home.
          </p>
        </div>

        {/* Bottom zone — CTA + caption */}
        <div className="w-full">
          <Link
            href="/home"
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] py-[18px] font-[family-name:var(--font-friended-jakarta)] text-[17px] font-extrabold text-white shadow-[0_14px_30px_-8px_rgba(108,170,216,0.70)] transition active:opacity-80"
          >
            <HomeIcon />
            <span>Open home</span>
          </Link>
          <p className="text-center font-[family-name:var(--font-friended-lora)] text-[13px] italic text-[#AFBEC9]">
            no awkward intros.
          </p>
        </div>
      </div>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
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
