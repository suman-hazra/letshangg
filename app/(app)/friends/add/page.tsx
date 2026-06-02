import Link from "next/link";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import { sendFriendRequest } from "../actions";

const lora = Lora({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "700"],
  variable: "--font-add-friend-serif",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-add-friend-sans",
});

export default async function AddFriendPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main
      className={`${lora.variable} ${jakarta.variable} relative z-10 flex-1 px-5 pb-8 pt-5`}
    >
      <div className="mx-auto w-full max-w-[430px]">
        <Link
          href="/friends"
          className="mb-5 inline-flex items-center gap-1 font-[family-name:var(--font-add-friend-sans)] text-xs font-bold uppercase tracking-widest text-[#8CC0EB] transition active:opacity-60"
        >
          <ArrowLeftIcon />
          <span>Friends</span>
        </Link>

        <h1 className="font-[family-name:var(--font-add-friend-serif)] text-[30px] font-bold leading-tight text-[#2D3E4E]">
          Find someone.
        </h1>
        <p className="mb-8 mt-2 font-[family-name:var(--font-add-friend-sans)] text-[13px] leading-relaxed text-[#8A9CAB]">
          Type their Letshangg username. They&apos;ll get a request to accept.
        </p>

        <form action={sendFriendRequest}>
          <label className="block">
            <span className="mb-2 block font-[family-name:var(--font-add-friend-sans)] text-xs font-bold uppercase tracking-[0.07em] text-[#9AACBA]">
              Username
            </span>
            <div className="mb-4 flex items-center gap-2 rounded-2xl border-[1.5px] border-[rgba(140,192,235,0.35)] bg-white/75 px-4 py-[14px] backdrop-blur-md">
              <span className="font-[family-name:var(--font-add-friend-sans)] text-base font-medium text-[#8CC0EB]">
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
                className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-add-friend-sans)] text-[15px] text-[#2D3E4E] placeholder:text-[#C8D6E0] focus:outline-none"
              />
            </div>
          </label>

          {error && (
            <p className="mb-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-add-friend-sans)] text-sm text-[#EF6458] backdrop-blur-md">
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            className="mb-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8CC0EB_0%,#6AAAD8_100%)] py-[15px] font-[family-name:var(--font-add-friend-sans)] text-[15px] font-bold text-white shadow-sm transition active:opacity-80"
          >
            <SendIcon />
            <span>Send request</span>
          </button>
        </form>

        <p className="text-center font-[family-name:var(--font-add-friend-serif)] text-xs italic text-[#AFBEC9]">
          they won&apos;t see if you said no.
        </p>
      </div>
    </main>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
