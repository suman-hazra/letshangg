import { signInWithGoogle } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="w-full max-w-[430px] text-center">
        <p className="font-sans text-sm tracking-widest uppercase text-muted">
          letshangg
        </p>

        <h1 className="mt-8 font-serif text-4xl leading-[1.1] text-ink">
          Sign in to start
          <br />
          hanging.
        </h1>

        <p className="mt-6 font-sans text-base text-muted leading-relaxed">
          We&apos;ll match you with friends who want the same kind of weekend
          you do.
        </p>

        <form action={signInWithGoogle} className="mt-10">
          {next && <input type="hidden" name="next" value={next} />}
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-ink px-7 text-sm font-medium text-surface transition hover:opacity-90"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </form>

        <p className="mt-8 font-script text-lg text-muted">
          friends-only, no strangers.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#fff"
        d="M21.35 11.1H12v3.8h5.35c-.5 2.4-2.5 3.7-5.35 3.7-3.25 0-5.9-2.65-5.9-5.9s2.65-5.9 5.9-5.9c1.45 0 2.75.5 3.75 1.45l2.85-2.85C17 3.65 14.7 2.7 12 2.7 6.85 2.7 2.7 6.85 2.7 12s4.15 9.3 9.3 9.3c5.35 0 8.9-3.75 8.9-9 0-.55-.05-1.05-.15-1.55z"
      />
    </svg>
  );
}
