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

const BASE = "https://pdtdpyyzgjrslceuqkje.supabase.co/storage/v1/object/public/assets/carousel";

const hangCards = [
  {
    label: "Coffee",
    image: `${BASE}/coffee.jpg`,
  },
  {
    label: "Hiking",
    image: `${BASE}/hiking.jpg`,
  },
  {
    label: "Movies",
    image: `${BASE}/movies.jpg`,
  },
  {
    label: "Eating out",
    image: `${BASE}/eating.jpg`,
  },
  {
    label: "Drinks",
    image: `${BASE}/drinks.jpg`,
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
                <div className="relative h-[var(--card-h)] overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]">
                  <Image
                    src={card.image}
                    alt={card.label}
                    fill
                    className="object-cover"
                    sizes="148px"
                  />
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
