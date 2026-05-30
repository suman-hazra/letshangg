import Image from "next/image";
import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[430px] text-center">
        <Image
          src="/ChatGPT Image May 30, 2026, 03_45_06 PM.png"
          alt="letshangg"
          width={1536}
          height={1024}
          priority
          className="mx-auto h-auto w-72"
        />

        <h1 className="mt-6 font-serif text-5xl leading-[1.1] text-ink">
          Plans feel easier
          <br />
          when they&apos;re mutual.
        </h1>

        <p className="mt-6 font-sans text-base text-muted leading-relaxed">
          Say yes to the hangs you&apos;d actually do. If a friend says yes
          too, we connect you.
        </p>

        <Link
          href="/login"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-sm font-medium text-surface transition hover:opacity-90"
        >
          Find a hang
        </Link>

        <p className="mt-6 font-script text-xl text-muted">
          no pressure until it&apos;s a match.
        </p>
      </div>
    </main>
  );
}
