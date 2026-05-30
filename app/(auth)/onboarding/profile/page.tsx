import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProfile } from "./actions";

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

  // Defensive: trigger may have failed; ensure profile row exists.
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

  // Already onboarded? Skip ahead.
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
          Pick a username and a name your friends would recognize.
        </p>

        <form action={saveProfile} className="mt-10 space-y-5">
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
}) {
  return (
    <label className="block">
      <span className="font-sans text-sm font-medium text-ink">{label}</span>
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
