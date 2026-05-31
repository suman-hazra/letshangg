import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "About — letshangg",
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
            Making plans with friends should be easy. In practice, it&apos;s a
            string of unanswered texts, vague "we should hang soon" promises,
            and nobody wanting to be the one to suggest something first.
          </p>

          <p>
            letshangg cuts through that. You tell it what kinds of hangouts
            you&apos;re actually up for — coffee, hiking, a movie, drinks —
            and it quietly finds which of your friends want the same thing.
            When there&apos;s a match, both of you find out at the same time.
            No awkward asks. No visible rejection.
          </p>

          <p>
            It&apos;s friends-only. No discovery, no strangers, no swiping on
            people you don&apos;t know. Just a better way to actually hang with
            the people already in your life.
          </p>

          <hr className="border-[#E8E4DF]" />

          <p>
            letshangg is a personal project built by{" "}
            <a
              href="https://github.com/suman-hazra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E8855A] hover:underline"
            >
              Suman Hazra
            </a>
            . It&apos;s open source, non-commercial, and very much a work in
            progress. Feedback and contributions are very welcome.
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
