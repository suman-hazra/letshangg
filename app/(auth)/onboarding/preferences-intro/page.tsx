import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { Lora, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { createClient } from "@/lib/supabase/server";

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

export default async function PreferencesIntroPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const isPreview = process.env.NODE_ENV !== "production" && preview === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPreview) redirect("/login");

  return (
    <main
      className={`${poppins.variable} ${jakarta.variable} ${lora.variable} landing-screen relative h-[100svh] max-h-[100dvh] overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)]`}
    >
      <div className="pointer-events-none absolute left-1/2 -top-24 h-[380px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[340px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />

      <div className="relative mx-auto flex h-full max-w-[430px] flex-col px-7 pt-12 pb-[var(--page-pad-b)]">
        <div className="flex items-center">
          <div className="relative h-8 w-[57px] -translate-y-2 overflow-hidden opacity-90">
            <Image
              src="/logo-mark.png"
              alt="letshangg"
              fill
              sizes="57px"
              priority
              className="object-contain"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-1 flex-col">
          <h1 className="font-[family-name:var(--font-landing-heading)] text-[32px] font-extrabold leading-[1.1] tracking-[-0.025em] text-[#15293A]">
            Pick the hangs
            <br />
            you&apos;d actually do.
          </h1>

          <p className="mt-3 font-[family-name:var(--font-landing-sans)] text-[15px] font-medium leading-relaxed text-[#4A6173]">
            We&apos;ll show you 30 hangout ideas. Rate each one so we can
            figure out your vibe.
          </p>

          <section className="mt-4">
            <h2 className="mb-2 font-[family-name:var(--font-landing-sans)] text-[11px] font-bold uppercase tracking-[0.09em] text-[#8CC0EB]">
              How it works
            </h2>

            <div className="flex w-full items-center justify-between rounded-2xl border-[1.5px] border-[rgba(140,192,235,0.25)] bg-white p-3 shadow-[0_4px_16px_-8px_rgba(140,192,235,0.4)]">
              <RatingOption
                label="Yay 👍"
                caption="you're in"
                chipClassName="bg-[rgba(140,192,235,0.18)] text-[#4D9ECE]"
              />
              <div className="h-10 w-px bg-[rgba(140,192,235,0.3)]" />
              <RatingOption
                label="Meh 🤷"
                caption="maybe"
                chipClassName="bg-[rgba(255,234,204,0.8)] text-[#C9894A]"
              />
              <div className="h-10 w-px bg-[rgba(140,192,235,0.3)]" />
              <RatingOption
                label="Nay 👎"
                caption="not your thing"
                chipClassName="bg-[rgba(255,248,210,0.8)] text-[#9A8A50]"
              />
            </div>
          </section>

          <div className="mt-3 space-y-3">
            <InfoCard
              icon={<LockIcon />}
              iconClassName="bg-[rgba(140,192,235,0.15)] text-[#8CC0EB]"
              title="Your picks stay private."
            >
              Friends only see a match when you both say yes to the same kind
              of plan.
            </InfoCard>

            <InfoCard
              icon={<SparklesIcon />}
              iconClassName="bg-[rgba(255,234,204,0.8)] text-[#C9894A]"
              title="We use them to find overlap."
            >
                Coffee, hikes, movies, drinks, and more become easy suggestions
                when a friend is into them too.
            </InfoCard>
          </div>
        </div>

        <Link
          href="/onboarding/preferences"
          className="group mt-auto mb-3 flex w-full shrink-0 items-center justify-center gap-3 rounded-full bg-[linear-gradient(135deg,#8CC0EB_0%,#6FB0E6_100%)] px-7 py-[var(--cta-py)] font-[family-name:var(--font-landing-sans)] text-lg font-extrabold leading-[1.4] text-white shadow-[0_14px_30px_-8px_rgba(111,176,230,0.95)] transition active:scale-[0.97]"
        >
          Let&apos;s go
          <span className="grid size-7 place-items-center rounded-full bg-white/25 transition group-active:translate-x-0.5">
            <ArrowIcon />
          </span>
        </Link>

        <p className="mt-[var(--foot-gap)] shrink-0 text-center font-[family-name:var(--font-landing-note)] text-[13.5px] font-normal italic leading-[1.4] text-[#4A6173]">
          only mutual yeses become matches.
        </p>
      </div>
    </main>
  );
}

function RatingOption({
  label,
  caption,
  chipClassName,
}: {
  label: string;
  caption: string;
  chipClassName: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div
        className={`flex h-9 w-[78px] items-center justify-center rounded-xl font-[family-name:var(--font-landing-sans)] text-[13.5px] font-bold ${chipClassName}`}
      >
        {label}
      </div>
      <p className="mt-1 text-center font-[family-name:var(--font-landing-sans)] text-[10px] font-medium text-[#9AACBA]">
        {caption}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  iconClassName,
  title,
  children,
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-[1.5px] border-[rgba(140,192,235,0.25)] bg-white p-3 shadow-[0_4px_16px_-8px_rgba(140,192,235,0.35)]">
      <div
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>
      <div>
        <p className="font-[family-name:var(--font-landing-sans)] text-[13px] font-bold text-[#15293A]">
          {title}
        </p>
        <p className="mt-1 font-[family-name:var(--font-landing-sans)] text-[12px] font-medium leading-[1.45] text-[#5C7A8A]">
          {children}
        </p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        width="18"
        height="11"
        x="3"
        y="11"
        rx="2"
        ry="2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M9.9 4.24 8.7 7.18a2 2 0 0 1-1.08 1.08L4.68 9.46l2.94 1.2a2 2 0 0 1 1.08 1.08l1.2 2.94 1.2-2.94a2 2 0 0 1 1.08-1.08l2.94-1.2-2.94-1.2a2 2 0 0 1-1.08-1.08Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M19 13v3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M20.5 14.5h-3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M4 17v2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M5 18H3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
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
