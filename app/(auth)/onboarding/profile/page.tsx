import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfile } from "./actions";
import { OnboardingAvatarUploader } from "./client";

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
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase
      .from("profiles")
      .insert({
        id: user.id,
        username: `user_${user.id.replace(/-/g, "").slice(0, 12)}`,
      });
  }

  if (profile?.display_name) {
    redirect("/onboarding/preferences");
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-[430px]">
        <p className="font-sans text-sm tracking-widest uppercase text-muted text-center">
          letshangg
        </p>

        <h1 className="mt-8 font-serif text-4xl leading-[1.1] text-ink text-center">
          Who are you,
          <br />
          really?
        </h1>

        <p className="mt-4 font-sans text-base text-muted text-center">
          Set up your profile so friends know it&apos;s you.
        </p>

        {/* Avatar uploader — lives outside the form, persists independently */}
        <div className="mt-10 flex justify-center">
          <OnboardingAvatarUploader userId={user.id} />
        </div>

        <form action={saveProfile} className="mt-8 space-y-5">
          <Field
            label="Username"
            name="username"
            placeholder="e.g. suman"
            hint="lowercase, no spaces. how friends find you."
            defaultValue={
              profile?.username && !profile.username.startsWith("user_")
                ? profile.username
                : ""
            }
            autoFocus
            required
            pattern="[a-z0-9_]{3,20}"
            title="3-20 chars: lowercase letters, numbers, underscores"
          />

          <Field
            label="Display name"
            name="display_name"
            placeholder="e.g. Suman"
            hint="how you appear on hang cards."
            required
            maxLength={40}
          />

          <Field
            label="City"
            name="city"
            placeholder="e.g. San Francisco"
            hint="optional — helps match you with nearby friends."
            maxLength={60}
            list="cities"
          />
          <datalist id="cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          {error && (
            <p className="font-sans text-sm text-danger">
              {decodeURIComponent(error)}
            </p>
          )}

          <button
            type="submit"
            className="w-full h-12 rounded-full bg-ink text-surface font-sans text-sm font-medium transition hover:opacity-90"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  hint,
  defaultValue,
  autoFocus,
  required,
  pattern,
  maxLength,
  title,
  list,
}: {
  label: string;
  name: string;
  placeholder?: string;
  hint?: string;
  defaultValue?: string;
  autoFocus?: boolean;
  required?: boolean;
  pattern?: string;
  maxLength?: number;
  title?: string;
  list?: string;
}) {
  return (
    <label className="block">
      <span className="font-sans text-sm font-medium text-ink">
        {label}
        {!required && (
          <span className="ml-1.5 font-sans text-xs font-normal text-muted">
            optional
          </span>
        )}
      </span>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        pattern={pattern}
        maxLength={maxLength}
        title={title}
        list={list}
        className="mt-1.5 w-full h-12 px-4 rounded-2xl bg-surface border border-line font-sans text-base text-ink placeholder:text-muted focus:outline-none focus:border-ink transition"
      />
      {hint && (
        <span className="mt-1.5 block font-sans text-xs text-muted">
          {hint}
        </span>
      )}
    </label>
  );
}
