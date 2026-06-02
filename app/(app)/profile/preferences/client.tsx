"use client";

import { togglePreference } from "../actions";

type Verdict = "yay" | "meh" | "nay";

type Preference = {
  id: string;
  label: string;
  activity_key: string;
  verdict: Verdict;
};

const VERDICTS: Verdict[] = ["yay", "meh", "nay"];

const ACTIVITY_EMOJIS: Record<string, string> = {
  coffee: "☕",
  pizza: "🍕",
  movie: "🎬",
  drinks: "🍹",
  house_party: "🏠",
  dancing: "🪩",
  workout: "💪",
  bike: "🚲",
  pickup_sport: "🏀",
  rock_climbing: "🧗",
  hike: "🥾",
  park: "🌿",
  sunset_walk: "🌅",
  beach: "🏖️",
  show: "🎸",
  museum: "🏛️",
  bookstore: "📚",
  theater_comedy: "🎭",
  cooking: "🍳",
  pottery_class: "🎨",
  thrift: "🛍️",
  bowling: "🎳",
  game_night: "🎮",
  arcade_mini_golf: "⛳",
  ice_cream: "🍦",
  restaurant: "🍽️",
  self_care: "🧖",
  day_trip: "🚗",
  escape_room: "🧩",
  festival: "🎪",
};

export function HangPreferencesForm({
  preferences,
}: {
  preferences: Preference[];
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 px-5 py-3">
        <LegendItem color="#8CC0EB" label="YAY" />
        <LegendItem color="#F5C98A" label="MEH" />
        <LegendItem color="#EF6458" label="NAY" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8">
        <ul className="flex flex-col gap-[10px]">
          {preferences.map((preference) => {
            const selected = preference.verdict;

            return (
              <li
                key={preference.id}
                className="flex items-center justify-between rounded-2xl border border-white/70 bg-white/60 px-4 py-[13px] backdrop-blur-md"
              >
                <div className="flex min-w-0 items-center gap-2 pr-3">
                  <span className="text-lg leading-none" aria-hidden>
                    {ACTIVITY_EMOJIS[preference.activity_key] ?? "🤝"}
                  </span>
                  <p className="truncate font-[family-name:var(--font-hang-prefs-sans)] text-sm font-semibold text-[#2D3E4E]">
                    {preference.label}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-px overflow-hidden rounded-xl bg-[rgba(140,192,235,0.1)] p-1">
                  {VERDICTS.map((verdict) => (
                    <form action={togglePreference} key={verdict}>
                      <input
                        type="hidden"
                        name="preference_id"
                        value={preference.id}
                      />
                      <input
                        type="hidden"
                        name="new_verdict"
                        value={verdict}
                      />
                      <button
                        type="submit"
                        aria-pressed={selected === verdict}
                        aria-label={`Set ${preference.label} to ${verdict}`}
                        className={`min-w-[38px] rounded-[10px] px-[10px] py-[6px] font-[family-name:var(--font-hang-prefs-sans)] text-[11px] font-bold uppercase tracking-[0.04em] transition active:opacity-70 ${
                          selected === verdict
                            ? activeVerdictClass(verdict)
                            : "text-[#AFBEC9]"
                        }`}
                      >
                        {verdict}
                      </button>
                    </form>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function activeVerdictClass(verdict: Verdict) {
  if (verdict === "yay") return "bg-[#8CC0EB] text-white";
  if (verdict === "meh") return "bg-[#FFEAD2] text-[#7A6C5A]";
  return "bg-[#EF6458] text-white";
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span className="font-[family-name:var(--font-hang-prefs-sans)] text-[10px] font-bold uppercase tracking-wider text-[#9AACBA]">
        {label}
      </span>
    </div>
  );
}
