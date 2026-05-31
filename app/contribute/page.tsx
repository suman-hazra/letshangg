import Link from "next/link";

export const metadata = {
  title: "Contribute — letshangg",
};

export default function ContributePage() {
  return (
    <main className="min-h-dvh bg-[#F7F5F2] px-6 py-12">
      <div className="mx-auto max-w-[640px]">
        <Link
          href="/about"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#7A7570] hover:text-[#1A1714]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          About
        </Link>

        <h1 className="text-3xl font-bold text-[#1A1714]">Contribute</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#7A7570]">
          letshangg is open source and built in the open. There are two ways to
          get involved.
        </p>

        <div className="mt-10 space-y-6">
          {/* GitHub */}
          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1A1714]">
                <GitHubIcon />
              </div>
              <h2 className="text-lg font-semibold text-[#1A1714]">Code on GitHub</h2>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#3A3330]">
              Browse the source, open issues, or submit a pull request. Bug
              fixes, feature ideas, and design improvements are all welcome.
            </p>
            <a
              href="https://github.com/suman-hazra/letshangg"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1A1714] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-80"
            >
              View on GitHub
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9m0 0L8 3.5M11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          {/* Feedback */}
          <div className="rounded-2xl border border-[#E8E4DF] bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FBF0EB]">
                <span className="text-lg">💬</span>
              </div>
              <h2 className="text-lg font-semibold text-[#1A1714]">Share feedback</h2>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed text-[#3A3330]">
              Used the app and have thoughts? Something felt off, or something
              worked really well? Send a note — every bit of feedback shapes
              what gets built next.
            </p>
            <a
              href="mailto:suman@letshangg.app?subject=letshangg feedback"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#E8E4DF] bg-[#F7F5F2] px-5 py-2.5 text-sm font-semibold text-[#1A1714] transition hover:border-[#ccc]"
            >
              Email feedback
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2.5 7h9m0 0L8 3.5M11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-12 border-t border-[#E8E4DF] pt-6 text-center text-sm text-[#7A7570]">
          <Link href="/about" className="hover:text-[#1A1714]">About</Link>
          <span className="mx-3 text-[#E8E4DF]">·</span>
          <Link href="/terms" className="hover:text-[#1A1714]">Terms</Link>
          <span className="mx-3 text-[#E8E4DF]">·</span>
          <Link href="/privacy" className="hover:text-[#1A1714]">Privacy</Link>
        </div>
      </div>
    </main>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}
