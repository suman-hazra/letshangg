import Image from "next/image";
import Link from "next/link";
import { Lora, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { signInAsDemo, signInWithGoogle } from "./actions";

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

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <main
      className={`${poppins.variable} ${jakarta.variable} ${lora.variable} landing-screen relative h-[100svh] max-h-[100dvh] overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)] px-7 pt-[var(--page-pad)] pb-[var(--page-pad-b)]`}
    >
      <div className="pointer-events-none absolute left-1/2 -top-24 h-[380px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[340px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />

      <div className="relative mx-auto flex h-full w-full max-w-[430px] flex-col text-center">
        {/* Logo — identical markup to landing page for seamless transition */}
        <div className="relative mx-auto h-[var(--logo-h)] w-[220px] shrink-0 overflow-hidden">
          <Image
            src="https://pdtdpyyzgjrslceuqkje.supabase.co/storage/v1/object/public/assets/logo.png"
            alt="letshangg"
            width={1536}
            height={1024}
            priority
            className="absolute left-1/2 top-0 h-auto w-[calc(var(--logo-h)*2.8)] max-w-none -translate-x-1/2 translate-y-[calc(var(--logo-h)*-0.43)] drop-shadow-sm"
          />
        </div>

        {/* Headline + button vertically centered in remaining space */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="font-[family-name:var(--font-landing-heading)] text-[36px] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#15293A]">
            Sign in to start
            <br />
            hanging.
          </h1>

          <p className="mx-auto mt-5 max-w-[290px] font-[family-name:var(--font-landing-sans)] text-[15.5px] font-medium leading-[1.625] text-[#4A6173]">
            We&apos;ll match you with friends who want the same kind of hangouts
            you do.
          </p>

          {error && (
            <p className="mx-auto mt-4 max-w-[300px] rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-landing-sans)] text-[13px] font-medium leading-[1.5] text-[#B0564A] backdrop-blur-md">
              {decodeURIComponent(error)}
            </p>
          )}

          <form
            action={signInWithGoogle}
            suppressHydrationWarning
            className="mt-20 w-full"
          >
            {next && <input type="hidden" name="next" value={next} />}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-full border border-[rgba(140,192,235,0.35)] bg-white px-7 py-[18px] font-[family-name:var(--font-landing-sans)] text-[16.5px] font-bold leading-[1.4] text-[#1F2D3A] shadow-[0_4px_24px_-8px_rgba(140,192,235,0.7),0_1px_4px_rgba(0,0,0,0.06)] transition active:scale-[0.98]"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          </form>

          <form action={signInAsDemo} className="mt-4 w-full">
            <button
              type="submit"
              className="w-full rounded-full border-[1.5px] border-[rgba(140,192,235,0.45)] bg-white/40 px-7 py-[15px] font-[family-name:var(--font-landing-sans)] text-[15px] font-bold leading-[1.4] text-[#3D617C] backdrop-blur-sm transition active:scale-[0.98]"
            >
              Just looking? Try the demo
            </button>
          </form>

          <p className="mt-6 font-[family-name:var(--font-landing-note)] text-[13.5px] italic leading-[1.4] text-[#4A6173]">
            friends-only, no strangers.
          </p>
        </div>

        {/* Terms anchored to bottom */}
        <p className="shrink-0 font-[family-name:var(--font-landing-sans)] text-[11.5px] font-medium leading-[1.4] text-[#9AACBA]">
          By continuing you agree to our{" "}
          <Link
            href="/terms"
            className="text-[#6A9DBB] underline-offset-2 hover:underline"
          >
            Terms
          </Link>{" "}
          &amp;{" "}
          <Link
            href="/privacy"
            className="text-[#6A9DBB] underline-offset-2 hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
