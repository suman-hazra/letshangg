import Image from "next/image";
import { redirect } from "next/navigation";
import { Lora, Plus_Jakarta_Sans, Poppins } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { saveProfile } from "./actions";
import { OnboardingAvatarUploader, UsernameField } from "./client";

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

const CITIES = [
  // United States
  "New York City", "Los Angeles", "Chicago", "Houston", "Phoenix",
  "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose",
  "Austin", "Jacksonville", "Fort Worth", "Columbus", "Charlotte",
  "Indianapolis", "San Francisco", "Seattle", "Denver", "Nashville",
  "Oklahoma City", "El Paso", "Washington DC", "Las Vegas", "Louisville",
  "Memphis", "Portland", "Baltimore", "Milwaukee", "Albuquerque",
  "Tucson", "Fresno", "Sacramento", "Kansas City", "Atlanta",
  "Miami", "Minneapolis", "Raleigh", "Tampa", "New Orleans",
  "Cleveland", "Detroit", "Boston", "Pittsburgh", "Salt Lake City",
  // Canada
  "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton",
  // United Kingdom
  "London", "Manchester", "Birmingham", "Glasgow", "Liverpool", "Edinburgh",
  // Europe
  "Paris", "Berlin", "Madrid", "Rome", "Amsterdam", "Barcelona",
  "Brussels", "Vienna", "Zurich", "Stockholm", "Oslo", "Copenhagen",
  "Lisbon", "Dublin", "Warsaw", "Prague", "Budapest", "Athens",
  // Asia-Pacific
  "Tokyo", "Seoul", "Shanghai", "Beijing", "Hong Kong", "Singapore",
  "Mumbai", "Delhi", "Bangalore", "Sydney", "Melbourne", "Auckland",
  // Middle East & Africa
  "Dubai", "Abu Dhabi", "Tel Aviv", "Istanbul", "Cairo", "Lagos",
  "Nairobi", "Johannesburg", "Cape Town",
  // Latin America
  "São Paulo", "Rio de Janeiro", "Buenos Aires", "Bogotá", "Lima",
  "Santiago", "Mexico City",
];

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; preview?: string }>;
}) {
  const { error, preview } = await searchParams;
  const isPreview = process.env.NODE_ENV !== "production" && preview === "1";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPreview) redirect("/login");

  const userId = user?.id ?? "00000000-0000-4000-8000-000000000000";
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  if (user && !profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      username: `user_${user.id.replace(/-/g, "").slice(0, 12)}`,
    });
  }

  if (profile?.display_name) {
    redirect("/onboarding/preferences");
  }

  return (
    <main
      className={`${poppins.variable} ${jakarta.variable} ${lora.variable} relative min-h-dvh overflow-hidden bg-[linear-gradient(170deg,#FFF8D6_0%,#FFEAD2_34%,#DCEEFA_72%,#CFE7FB_100%)]`}
    >
      {/* Blur blobs */}
      <div className="pointer-events-none absolute left-1/2 -top-24 h-[380px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#FFE08A_0%,rgba(255,224,138,0)_68%)] opacity-50 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 bottom-0 h-[340px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,#9ACDF2_0%,rgba(154,205,242,0)_70%)] opacity-45 blur-3xl" />

      <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col px-7 pt-12 pb-0">

        {/* Top bar */}
        <div className="flex items-center">
          <div className="relative h-8 w-[57px] -translate-y-2 overflow-hidden opacity-90">
            <Image
              src="/logo-mark.png"
              alt="letshangg"
              fill
              sizes="57px"
              priority
              className="object-contain"
            />
          </div>
        </div>

        <p className="mt-4 font-[family-name:var(--font-landing-sans)] text-[14.5px] font-medium leading-[1.625] text-[#4A6173]">
          Set up your profile so friends know it&apos;s you.
        </p>

        {/* Avatar uploader */}
        <div className="mt-6">
          <OnboardingAvatarUploader userId={userId} />
        </div>

        {/* Form */}
        <form
          action={saveProfile}
          suppressHydrationWarning
          className="mt-4 flex flex-col gap-3"
        >

          {/* Name */}
          <div className="rounded-2xl border border-[rgba(140,192,235,0.4)] bg-white px-4 py-[14px] shadow-[0_2px_10px_-6px_rgba(140,192,235,0.5)]">
            <div className="mb-2 flex items-center gap-1.5">
              <UserIcon />
              <span className="font-[family-name:var(--font-landing-sans)] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#5C7A8A]">
                Name
              </span>
            </div>
            <input
              name="display_name"
              type="text"
              placeholder="e.g. John"
              required
              maxLength={40}
              autoFocus
              suppressHydrationWarning
              className="w-full bg-transparent font-[family-name:var(--font-landing-sans)] text-[15px] font-medium text-[#1F2D3A] placeholder:text-[#B8C8D4] focus:outline-none"
            />
          </div>

          {/* Username */}
          <div className="rounded-2xl border border-[rgba(140,192,235,0.4)] bg-white px-4 py-[14px] shadow-[0_2px_10px_-6px_rgba(140,192,235,0.5)]">
            <div className="mb-2 flex items-center gap-1.5">
              <AtIcon />
              <span className="font-[family-name:var(--font-landing-sans)] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#5C7A8A]">
                Username
              </span>
            </div>
            <UsernameField
              defaultValue={
                profile?.username && !profile.username.startsWith("user_")
                  ? profile.username
                  : ""
              }
            />
          </div>

          {/* City */}
          <div className="rounded-2xl border border-[rgba(140,192,235,0.25)] bg-white px-4 py-[14px] shadow-[0_2px_10px_-6px_rgba(140,192,235,0.3)]">
            <div className="mb-2 flex items-center gap-1.5">
              <MapPinIcon />
              <span className="font-[family-name:var(--font-landing-sans)] text-[11.5px] font-bold uppercase tracking-[0.08em] text-[#5C7A8A]">
                City
              </span>
              <span className="rounded-full bg-[rgba(140,192,235,0.15)] px-2 py-0.5 font-[family-name:var(--font-landing-sans)] text-[10px] font-bold uppercase text-[#8CC0EB]">
                Optional
              </span>
            </div>
            <input
              name="city"
              type="text"
              placeholder="e.g. San Francisco"
              maxLength={60}
              list="cities"
              suppressHydrationWarning
              className="w-full bg-transparent font-[family-name:var(--font-landing-sans)] text-[15px] font-medium text-[#1F2D3A] placeholder:text-[#B8C8D4] focus:outline-none"
            />
          </div>

          <datalist id="cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {error && (
            <p className="font-[family-name:var(--font-landing-sans)] text-sm text-danger">
              {decodeURIComponent(error)}
            </p>
          )}

          {/* CTA */}
          <button
            type="submit"
            className="flex w-full items-center justify-between rounded-full bg-[linear-gradient(135deg,#8CC0EB_0%,#6FB0E6_100%)] px-6 py-[19px] shadow-[0_14px_30px_-8px_rgba(111,176,230,0.9)] transition active:scale-[0.97]"
          >
            <span className="font-[family-name:var(--font-landing-sans)] text-[17.5px] font-extrabold text-white">
              Continue
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(255,255,255,0.25)]">
              <ArrowRightIcon />
            </div>
          </button>

          {/* Footnote */}
          <p className="mt-1 text-center font-[family-name:var(--font-landing-note)] text-[13px] text-[#7A96A8]">
            you can update this anytime.
          </p>

        </form>
      </div>
    </main>
  );
}

function UserIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5C7A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function AtIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5C7A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#5C7A8A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
