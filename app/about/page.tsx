import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About letshangg",
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-[#F7F5F2] px-6 py-12">
      <div className="mx-auto max-w-[640px]">
        <div className="relative mx-auto mb-10 h-[64px] w-[180px] overflow-hidden">
          <Image
            src="https://pdtdpyyzgjrslceuqkje.supabase.co/storage/v1/object/public/assets/logo.png"
            alt="letshangg"
            width={1536}
            height={1024}
            priority
            className="absolute left-1/2 top-0 h-auto w-[179px] max-w-none -translate-x-1/2 -translate-y-[27px] drop-shadow-sm"
          />
        </div>

        <h1 className="text-3xl font-bold text-[#1A1714]">About letshangg</h1>

        <div className="mt-8 space-y-6 text-[15px] leading-relaxed text-[#3A3330]">
          <p>
            letshangg started with a small, annoying truth: the people I most
            wanted to see were the ones I saw the least. Not for any real
            reason. Just inertia, unanswered texts, and that quiet hesitation
            about being the one to reach out first.
          </p>

          <p>
            This is my attempt to fix that. You pick the kinds of hangouts you
            enjoy, like coffee, hiking, movies, or drinks, and letshangg finds
            the friends who are up for the same thing. When there&apos;s a
            match, you both learn it together. No pressure, no awkward ask, and
            no one ever sees a no.
          </p>

          <p>
            It&apos;s friends only, on purpose. No strangers, no discovery feed,
            no swiping through people you&apos;ve never met. Just a gentler way
            to keep up with the people you already care about.
          </p>

          <hr className="border-[#E8E4DF]" />

          <p>
            I&apos;m{" "}
            <a
              href="https://github.com/suman-hazra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E8855A] hover:underline"
            >
              Suman Hazra
            </a>
            , and letshangg is a personal project I keep tinkering with.
            It&apos;s open source, non-commercial, and a work in progress, so
            feedback and contributions mean a lot.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/contribute"
            className="rounded-full bg-[#1A1714] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
          >
            Contribute
          </Link>
          <Link
            href="/terms"
            className="rounded-full border border-[#E8E4DF] bg-white px-5 py-2.5 text-sm font-semibold text-[#3A3330] transition hover:border-[#ccc]"
          >
            Terms
          </Link>
          <Link
            href="/privacy"
            className="rounded-full border border-[#E8E4DF] bg-white px-5 py-2.5 text-sm font-semibold text-[#3A3330] transition hover:border-[#ccc]"
          >
            Privacy
          </Link>
        </div>
      </div>
    </main>
  );
}
