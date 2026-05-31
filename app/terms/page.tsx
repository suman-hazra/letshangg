import Link from "next/link";

export const metadata = {
  title: "Terms of Service — letshangg",
};

export default function TermsPage() {
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

        <h1 className="font-serif text-3xl font-bold text-[#1A1714]">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#7A7570]">Last updated: May 30, 2026</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-[#3A3330]">
          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">1. What letshangg is</h2>
            <p>
              Letshangg is a personal project that helps you coordinate hangouts with people you already know. It is not a dating app and is not intended for meeting strangers. By using letshangg you confirm that you are using it to connect with existing friends only.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to use letshangg. By signing in you represent that you meet this requirement.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">3. Your account</h2>
            <p>
              You sign in using your Google account. You are responsible for any activity that occurs through your account. Do not share your account or access credentials with others.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">4. Acceptable use</h2>
            <p>You agree not to use letshangg to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[#3A3330]">
              <li>Harass, threaten, or harm other users</li>
              <li>Impersonate another person</li>
              <li>Send unsolicited or spam messages</li>
              <li>Attempt to access accounts or data you do not own</li>
              <li>Use the service for any unlawful purpose</li>
            </ul>
            <p className="mt-3">We reserve the right to suspend or delete accounts that violate these rules.</p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">5. Content you provide</h2>
            <p>
              Any content you submit — profile information, preferences, messages — remains yours. By submitting it you grant letshangg a limited license to store and display it as needed to operate the service. We do not sell or license your content to third parties.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">6. No warranties</h2>
            <p>
              Letshangg is provided &ldquo;as is&rdquo; without warranties of any kind. This is a personal portfolio project. It may go down, change, or stop working at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">7. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, letshangg and its creator shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">8. Changes</h2>
            <p>
              We may update these terms from time to time. Continued use of letshangg after changes are posted constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold text-[#1A1714]">9. Contact</h2>
            <p>
              Questions? Reach us at{" "}
              <a href="mailto:suman@letshangg.app" className="text-[#E8855A] hover:underline">
                suman@letshangg.app
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 border-t border-[#E8E4DF] pt-6 text-center text-sm text-[#7A7570]">
          <Link href="/privacy" className="text-[#E8855A] hover:underline">Privacy Policy</Link>
          <span className="mx-3 text-[#E8E4DF]">·</span>
          <Link href="/login" className="hover:text-[#1A1714]">Back to sign in</Link>
        </div>
      </div>
    </main>
  );
}
