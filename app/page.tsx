import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[430px] text-center">
        <p className="font-sans text-sm tracking-widest uppercase text-muted">
          letshangg
        </p>

        <h1 className="mt-8 font-serif text-5xl leading-[1.1] text-ink">
          Plans that
          <br />
          actually happen.
        </h1>

        <p className="mt-6 font-sans text-base text-muted leading-relaxed">
          An AI matchmaker for hangouts with friends you already have. No
          awkward texts, no rejection.
        </p>

        <Link
          href="/login"
          className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-ink px-7 text-sm font-medium text-surface transition hover:opacity-90"
        >
          Get started
        </Link>

        <p className="mt-6 font-script text-xl text-muted">
          you and your friends, made easy.
        </p>
      </div>
    </main>
  );
}
