import { FindingHangsClient } from "./client";

export default function FindingHangsPage() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[430px] text-center">
        <p className="font-sans text-sm tracking-widest uppercase text-muted">
          letshangg
        </p>

        <div className="mt-16 flex items-center justify-center">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-60 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-accent" />
          </span>
        </div>

        <h1 className="mt-10 font-serif text-3xl leading-tight text-ink">
          Finding people you&apos;d
          <br />
          want to hang with…
        </h1>

        <p className="mt-6 font-script text-xl text-muted">
          give us a sec.
        </p>

        <FindingHangsClient />
      </div>
    </main>
  );
}
