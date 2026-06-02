import Link from "next/link";
import { sendFriendRequest } from "../actions";

export default async function AddFriendPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex flex-col items-center px-6 pb-12">
      <div className="w-full max-w-[430px]">
        <Link
          href="/friends"
          className="font-sans text-xs tracking-widest uppercase text-muted"
        >
          ← Friends
        </Link>

        <h1 className="mt-6 font-serif text-3xl text-ink leading-tight">
          Find someone.
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Type their letshangg username. They&apos;ll get a request to accept.
        </p>

        <form action={sendFriendRequest} className="mt-8 space-y-5">
          <label className="block">
            <span className="font-sans text-sm font-medium text-ink">
              Username
            </span>
            <div className="mt-1.5 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-base text-muted">
                @
              </span>
              <input
                name="username"
                type="text"
                autoFocus
                required
                pattern="[A-Za-z0-9_]{3,20}"
                title="3-20 chars: letters, numbers, underscores"
                autoCapitalize="none"
                placeholder="e.g. dustin"
                className="w-full h-12 pl-9 pr-4 rounded-2xl bg-surface border border-line font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
              />
            </div>
          </label>

          {error && (
            <p className="font-sans text-sm text-danger">
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-full bg-ink text-surface font-sans text-sm font-semibold transition hover:opacity-90"
          >
            Send request
          </button>
        </form>

        <p className="mt-8 font-script text-lg text-muted text-center">
          they won&apos;t see if you said no.
        </p>
      </div>
    </main>
  );
}
