/**
 * Instant feedback while the home server component runs (hang generation on
 * first load). Without this, the quiz → home transition shows a frozen
 * screen and reads as a lost connection.
 */
export default function HomeLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 animate-bounce rounded-full bg-[#8CC0EB]" />
          <span className="size-2.5 animate-bounce rounded-full bg-[#8CC0EB] [animation-delay:0.12s]" />
          <span className="size-2.5 animate-bounce rounded-full bg-[#8CC0EB] [animation-delay:0.24s]" />
        </div>
        <p className="text-sm font-medium text-[#8A9CAB]">
          finding your hangs…
        </p>
      </div>
    </main>
  );
}
