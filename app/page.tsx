import Image from "next/image";
import Link from "next/link";
import { Lora, Plus_Jakarta_Sans, Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: "800",
  variable: "--font-landing-heading",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-landing-sans",
});

const lora = Lora({
  subsets: ["latin"],
  style: "italic",
  variable: "--font-landing-note",
});

const hangCards = [
  {
    label: "Coffee",
    icon: "☕",
    gradient: "from-[#FFF3C9] to-[#FFE3A6]",
  },
  {
    label: "Hiking",
    icon: "🥾",
    gradient: "from-[#DBF1E0] to-[#BFE6CC]",
  },
  {
    label: "Movies",
    icon: "🎬",
    gradient: "from-[#D2E9FB] to-[#AFD6F3]",
  },
  {
    label: "Eating out",
    icon: "🍜",
    gradient: "from-[#FFE5CC] to-[#FBCBA3]",
  },
  {
    label: "Drinks",
    icon: "🍹",
    gradient: "from-[#FBD9CB] to-[#F6BDA8]",
  },
];

export default function Landing() {
  return (
    <main
      className={`${poppins.variable} ${jakarta.variable} ${lora.variable} landing-screen relative h-[100svh] max-h-[100dvh] overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)] px-7 pt-[var(--page-pad)] pb-[var(--page-pad-b)]`}
    >
      <div className="pointer-events-none absolute -left-5 -top-4 h-[340px] w-[340px] rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-80 blur-3xl" />
      <div className="pointer-events-none absolute -top-4 left-[120px] h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle,#FFC79E_0%,rgba(255,199,158,0)_68%)] opacity-75 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-60 blur-3xl" />

      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col text-center">
        <div className="relative mx-auto h-[var(--logo-h)] w-[220px] shrink-0 overflow-hidden">
          <Image
            src="https://pdtdpyyzgjrslceuqkje.supabase.co/storage/v1/object/public/assets/logo.png"
            alt="letshangg"
            width={1536}
            height={1024}
            priority
            className="absolute left-1/2 top-0 h-auto w-[calc(var(--logo-h)*2.8)] max-w-none -translate-x-1/2 translate-y-[calc(var(--logo-h)*-0.43)] drop-shadow-sm"
          />
        </div>

        <h1 className="mt-[var(--headline-gap)] font-[family-name:var(--font-landing-heading)] text-[length:var(--headline-size)] font-extrabold leading-[1.1] tracking-normal text-[#15293A]">
          Plans feel easier
          <br />
          <span className="whitespace-nowrap">
            when they&apos;re{" "}
            <span className="relative inline-block">
              <span className="absolute bottom-[3px] left-[-5px] right-[-6px] h-4 -rotate-1 rounded-md bg-[linear-gradient(90deg,#8CC0EB_0%,#BFDDF0_100%)]" />
              <span className="relative">mutual.</span>
            </span>
          </span>
        </h1>

        <p className="mx-auto mt-[var(--sub-gap)] max-w-[305px] font-[family-name:var(--font-landing-sans)] text-[length:var(--sub-size)] font-medium leading-[1.625] text-[#4A6173]">
          Say yes to the hangs you&apos;d actually do. If a friend says yes
          too, we connect you.
        </p>

        <div className="mt-[var(--carousel-gap)] -mx-7 shrink-0 overflow-x-auto scroll-smooth px-7 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max snap-x snap-mandatory gap-[var(--card-gap)]">
            {hangCards.map((card) => (
              <div
                key={card.label}
                className="w-[var(--card-w)] shrink-0 snap-start"
              >
                <div
                  className={`relative flex h-[var(--card-h)] items-center justify-center rounded-[22px] bg-gradient-to-br ${card.gradient} shadow-[inset_0_0_0_1px_rgba(255,255,255,0.65)]`}
                >
                  <span className="absolute right-2.5 top-2.5 inline-flex h-6 items-center gap-1 rounded-full bg-white/55 px-2 font-[family-name:var(--font-landing-sans)] text-[9px] font-extrabold uppercase leading-none text-[#3A5263]">
                    <PhotoIcon />
                    Photo
                  </span>
                  <span
                    className="leading-none drop-shadow-sm"
                    style={{ fontSize: "var(--card-icon-size)" }}
                  >
                    {card.icon}
                  </span>
                </div>
                <p className="mt-[var(--card-label-gap)] font-[family-name:var(--font-landing-sans)] text-sm font-bold leading-[1.4] text-[#284052]">
                  {card.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/login"
          className="group mt-auto flex w-full shrink-0 items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#8CC0EB_0%,#6FB0E6_100%)] px-7 py-[var(--cta-py)] font-[family-name:var(--font-landing-sans)] text-lg font-extrabold leading-[1.4] text-white shadow-[0_14px_30px_-8px_rgba(111,176,230,0.95)] transition active:scale-[0.97]"
        >
          Find a hang
          <span className="grid size-7 place-items-center rounded-full bg-white/25 transition group-active:translate-x-0.5">
            <ArrowIcon />
          </span>
        </Link>

        <p className="mt-[var(--foot-gap)] shrink-0 font-[family-name:var(--font-landing-note)] text-[13.5px] font-normal italic leading-[1.4] text-[#4A6173]">
          no pressure until it&apos;s a match.
        </p>
      </div>
    </main>
  );
}

function PhotoIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-2.5"
      fill="none"
      viewBox="0 0 10 10"
    >
      <rect
        height="7"
        rx="1.4"
        stroke="currentColor"
        strokeWidth="1"
        width="7"
        x="1.5"
        y="1.5"
      />
      <path
        d="m2.8 6.9 1.4-1.5 1 1 1.7-2 1.1 1.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1"
      />
      <circle cx="4" cy="3.7" fill="currentColor" r=".6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d="M3.5 8h8m0 0-3-3m3 3-3 3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}
