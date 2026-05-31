import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — letshangg",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-[#F7F5F2] px-6 py-12">
      <div className="mx-auto max-w-[640px]">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-[#7A7570] hover:text-[#1A1714]"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>

        <h1 className="font-serif text-3xl font-bold text-[#1A1714]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#7A7570]">Last updated: May 30, 2026</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[#3A3330]">
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">1. What we collect</h2>
            <p>When you use letshangg, we collect:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Google account info</strong> — your name, email address, and profile photo, provided when you sign in with Google.</li>
              <li><strong>Profile data</strong> — username, display name, age, and city that you enter during onboarding.</li>
              <li><strong>Hangout preferences</strong> — the activities you mark as yay or nay.</li>
              <li><strong>Messages</strong> — in-app messages sent after a mutual match.</li>
              <li><strong>Usage data</strong> — basic analytics (page views, events) collected via PostHog to help us understand how the app is used.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">2. How we use it</h2>
            <p>We use your data solely to operate letshangg:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Match you with friends who share your hangout interests</li>
              <li>Display your profile to friends you are already connected with</li>
              <li>Enable in-app messaging after a mutual match</li>
              <li>Improve the app based on aggregate usage patterns</li>
            </ul>
            <p className="mt-3">We do not use your data for advertising, profiling, or any purpose beyond running the service.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">3. Who we share it with</h2>
            <p>We do not sell your data. We share it only with the services required to run letshangg:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li><strong>Supabase</strong> — our database and authentication provider. Data is stored on Supabase&apos;s servers.</li>
              <li><strong>Vercel</strong> — our hosting provider. Your requests pass through Vercel&apos;s infrastructure.</li>
              <li><strong>PostHog</strong> — product analytics. Only anonymised usage events, no personal identifiers.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">4. Your profile visibility</h2>
            <p>
              Your profile (username, display name, avatar) is visible only to users you have an accepted friendship with. Your hangout preferences are never shown directly to other users — they are used only to compute matches.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">5. Data retention</h2>
            <p>
              We keep your data for as long as your account is active. If you would like your account and all associated data deleted, contact us at the email below and we will remove it within 7 days.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">6. Cookies &amp; storage</h2>
            <p>
              We use a session cookie issued by Supabase to keep you signed in. No advertising or tracking cookies are set.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">7. Children</h2>
            <p>
              Letshangg is not intended for anyone under 18. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">8. Changes</h2>
            <p>
              We may update this policy from time to time. Material changes will be noted at the top of this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">9. Contact</h2>
            <p>
              For privacy questions or data deletion requests, email{" "}
              <a href="mailto:suman@letshangg.app" className="text-[#E8855A] hover:underline">
                suman@letshangg.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[#E8E4DF] pt-6 text-center text-sm text-[#7A7570]">
          <Link href="/terms" className="text-[#E8855A] hover:underline">Terms of Service</Link>
          <span className="mx-3 text-[#E8E4DF]">·</span>
          <Link href="/login" className="hover:text-[#1A1714]">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
