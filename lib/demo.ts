/**
 * Demo mode.
 *
 * Lets a solo visitor experience the entire product loop without bringing a
 * friend: three persona accounts (real auth users + profiles flagged
 * `is_demo`) accept friendship instantly, hangs generate against their seeded
 * preferences, and they "swipe back" a believable beat after the visitor
 * swipes right — firing the real match flow, match email, and chat (where
 * they even reply).
 *
 * Personas are provisioned lazily and idempotently by ensureDemoPersonas()
 * the first time anyone adds demo friends — no separate seed script.
 *
 * Server-only (service-role client). Never import into a client component.
 */

import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateHangsForUser } from "@/lib/hang-manager";
import { sendMatchEmail } from "@/lib/email";

type AdminClient = ReturnType<typeof createAdminClient>;

/** How long a persona "thinks" before swiping right back. */
export const DEMO_SWIPE_BACK_DELAY_MS = 30_000;

/** Demo runs seed more hangs per persona so the stack feels alive. */
const DEMO_HANGS_PER_FRIEND = 3;

type PersonaDef = {
  username: string;
  displayName: string;
  email: string;
  city: string;
  avatarSeed: string;
  avatarBg: string;
  /** Short character sketch fed to the reply LLM. */
  vibe: string;
  yays: string[]; // activity_keys
  mehs: string[];
  cannedReplies: string[];
};

const DEMO_PERSONAS: PersonaDef[] = [
  {
    username: "maya_demo",
    displayName: "Maya",
    email: "maya@demo.letshangg.app",
    city: "San Francisco",
    avatarSeed: "maya-letshangg",
    avatarBg: "ffd5dc",
    vibe: "warm and easygoing, loves cozy plans — third-wave coffee, small museums, used bookstores",
    yays: [
      "coffee",
      "museum",
      "restaurant",
      "bookstore",
      "thrift",
      "ice_cream",
      "sunset_walk",
      "cooking",
      "pottery_class",
    ],
    mehs: ["hike", "movie", "park"],
    cannedReplies: [
      "yes i'm so in. saturday morning work for you?",
      "okay i've been wanting to do this forever, let's lock it in",
      "love that — i know the perfect spot, sending it over",
      "perfect timing honestly. early afternoon?",
    ],
  },
  {
    username: "dustin_demo",
    displayName: "Dustin",
    email: "dustin@demo.letshangg.app",
    city: "San Francisco",
    avatarSeed: "dustin-letshangg",
    avatarBg: "b6e3f4",
    vibe: "outdoorsy early riser, always up for trails, bikes, and a post-adventure burrito",
    yays: [
      "hike",
      "bike",
      "rock_climbing",
      "pickup_sport",
      "park",
      "beach",
      "day_trip",
      "coffee",
    ],
    mehs: ["museum", "pizza", "game_night"],
    cannedReplies: [
      "let's gooo. i'm free sunday morning if that works",
      "down. weather looks great this weekend too",
      "yes — been needing an excuse to get out. when are you free?",
      "say less. i'll bring snacks",
    ],
  },
  {
    username: "priya_demo",
    displayName: "Priya",
    email: "priya@demo.letshangg.app",
    city: "San Francisco",
    avatarSeed: "priya-letshangg",
    avatarBg: "ffdfbf",
    vibe: "social and spontaneous, lives for live shows, good cocktails, and dragging friends to weird events",
    yays: [
      "show",
      "drinks",
      "dancing",
      "theater_comedy",
      "festival",
      "restaurant",
      "game_night",
      "escape_room",
    ],
    mehs: ["coffee", "bowling", "movie"],
    cannedReplies: [
      "omg finally!! thursday or friday night?",
      "yessss. i already have like three ideas, picking the best one",
      "this is exactly what my week needed. you free friday?",
      "in. obviously. what time were you thinking?",
    ],
  },
];

function demoAvatarUrl(def: PersonaDef): string {
  return `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(
    def.avatarSeed,
  )}&backgroundColor=${def.avatarBg}`;
}

// ---------------------------------------------------------------------------
// Persona provisioning
// ---------------------------------------------------------------------------

type PersonaProfile = {
  id: string;
  username: string;
  display_name: string | null;
};

/**
 * Idempotent: creates any missing persona auth users (the DB trigger creates
 * their profile rows), claims those profiles, and (re)seeds preferences so
 * persona tastes stay current with the definitions above.
 */
export async function ensureDemoPersonas(
  admin: AdminClient = createAdminClient(),
): Promise<PersonaProfile[]> {
  const usernames = DEMO_PERSONAS.map((p) => p.username);
  const { data: existing } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .in("username", usernames)
    .eq("is_demo", true);

  const byUsername = new Map((existing ?? []).map((p) => [p.username, p]));
  const personas: PersonaProfile[] = [...(existing ?? [])];

  for (const def of DEMO_PERSONAS) {
    if (byUsername.has(def.username)) continue;
    const created = await createPersona(admin, def);
    if (created) personas.push(created);
  }

  await seedPersonaPreferences(admin, personas);
  return personas;
}

async function createPersona(
  admin: AdminClient,
  def: PersonaDef,
): Promise<PersonaProfile | null> {
  const { data, error } = await admin.auth.admin.createUser({
    email: def.email,
    email_confirm: true,
    user_metadata: { is_demo_persona: true },
  });

  if (error || !data.user) {
    // Likely a concurrent signup created it first — recover by username.
    const { data: recovered } = await admin
      .from("profiles")
      .select("id, username, display_name")
      .eq("username", def.username)
      .eq("is_demo", true)
      .maybeSingle();
    if (!recovered) console.error("demo persona create failed", error);
    return recovered ?? null;
  }

  // The on_auth_user_created trigger already inserted the profile — claim it.
  const { error: profileError } = await admin
    .from("profiles")
    .update({
      username: def.username,
      display_name: def.displayName,
      avatar_url: demoAvatarUrl(def),
      city: def.city,
      is_demo: true,
    })
    .eq("id", data.user.id);

  if (profileError) {
    console.error("demo persona profile claim failed", profileError);
    return null;
  }

  return {
    id: data.user.id,
    username: def.username,
    display_name: def.displayName,
  };
}

async function seedPersonaPreferences(
  admin: AdminClient,
  personas: PersonaProfile[],
): Promise<void> {
  if (personas.length === 0) return;

  const { data: prefs } = await admin
    .from("preference_options")
    .select("id, activity_key");
  const idByKey = new Map((prefs ?? []).map((p) => [p.activity_key, p.id]));

  const rows: {
    user_id: string;
    preference_id: string;
    verdict: "yay" | "meh";
  }[] = [];

  for (const def of DEMO_PERSONAS) {
    const persona = personas.find((p) => p.username === def.username);
    if (!persona) continue;
    for (const key of def.yays) {
      const prefId = idByKey.get(key);
      if (prefId) {
        rows.push({ user_id: persona.id, preference_id: prefId, verdict: "yay" });
      }
    }
    for (const key of def.mehs) {
      const prefId = idByKey.get(key);
      if (prefId) {
        rows.push({ user_id: persona.id, preference_id: prefId, verdict: "meh" });
      }
    }
  }

  if (rows.length > 0) {
    await admin
      .from("user_preferences")
      .upsert(rows, { onConflict: "user_id,preference_id" });
  }
}

// ---------------------------------------------------------------------------
// Friending + hang generation
// ---------------------------------------------------------------------------

export async function addDemoFriendsForUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const personas = await ensureDemoPersonas(admin);
  if (personas.length === 0) return;

  const personaIds = personas.map((p) => p.id);
  const idList = personaIds.join(",");

  // A user may already have a friendship row with a persona in either
  // direction (e.g. they searched for maya_demo by hand) — accept those
  // instead of inserting duplicates.
  const { data: existing } = await admin
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(
      `and(requester_id.eq.${userId},addressee_id.in.(${idList})),and(addressee_id.eq.${userId},requester_id.in.(${idList}))`,
    );

  const linked = new Set<string>();
  for (const f of existing ?? []) {
    const personaId = f.requester_id === userId ? f.addressee_id : f.requester_id;
    linked.add(personaId);
    if (f.status !== "accepted") {
      await admin
        .from("friendships")
        .update({ status: "accepted" })
        .eq("id", f.id);
    }
  }

  const missing = personaIds.filter((id) => !linked.has(id));
  if (missing.length > 0) {
    await admin.from("friendships").insert(
      missing.map((personaId) => ({
        requester_id: personaId, // persona "added you" — warmer framing
        addressee_id: userId,
        status: "accepted" as const,
      })),
    );
  }

  await generateHangsForUser(userId, { capPerFriend: DEMO_HANGS_PER_FRIEND });
}

export async function userHasDemoFriends(userId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: demoProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("is_demo", true);
  const ids = (demoProfiles ?? []).map((p) => p.id);
  if (ids.length === 0) return false;

  const idList = ids.join(",");
  const { count } = await admin
    .from("friendships")
    .select("id", { count: "exact", head: true })
    .or(
      `and(requester_id.eq.${userId},addressee_id.in.(${idList})),and(addressee_id.eq.${userId},requester_id.in.(${idList}))`,
    );
  return (count ?? 0) > 0;
}

export async function removeDemoFriendsForUser(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: demoProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("is_demo", true);
  const ids = (demoProfiles ?? []).map((p) => p.id);
  if (ids.length === 0) return;

  const idList = ids.join(",");

  // messages cascade with hangs; friendship_messages + reads cascade with
  // friendships.
  await admin
    .from("hangs")
    .delete()
    .or(
      `and(user_a.eq.${userId},user_b.in.(${idList})),and(user_b.eq.${userId},user_a.in.(${idList}))`,
    );
  await admin
    .from("friendships")
    .delete()
    .or(
      `and(requester_id.eq.${userId},addressee_id.in.(${idList})),and(addressee_id.eq.${userId},requester_id.in.(${idList}))`,
    );
}

// ---------------------------------------------------------------------------
// Timed swipe-backs
// ---------------------------------------------------------------------------

type SwipeBackHang = {
  user_a: string;
  user_b: string;
  swipe_a: "right" | "left" | null;
  swipe_b: "right" | "left" | null;
  swipe_a_at: string | null;
  swipe_b_at: string | null;
  matched: boolean;
};

/**
 * Pure eligibility check: the user right-swiped a persona hang, the persona
 * hasn't responded, and the user's swipe is at least `delayMs` old (legacy
 * rows without a timestamp count as due). Exported for tests.
 */
export function isDemoSwipeBackDue(
  hang: SwipeBackHang,
  userId: string,
  demoUserIds: ReadonlySet<string>,
  now: Date = new Date(),
  delayMs: number = DEMO_SWIPE_BACK_DELAY_MS,
): boolean {
  if (hang.matched) return false;

  const isUserA = hang.user_a === userId;
  const isUserB = hang.user_b === userId;
  if (!isUserA && !isUserB) return false;

  const otherId = isUserA ? hang.user_b : hang.user_a;
  if (!demoUserIds.has(otherId)) return false;

  const mySwipe = isUserA ? hang.swipe_a : hang.swipe_b;
  const otherSwipe = isUserA ? hang.swipe_b : hang.swipe_a;
  if (mySwipe !== "right" || otherSwipe !== null) return false;

  const mySwipeAt = isUserA ? hang.swipe_a_at : hang.swipe_b_at;
  if (!mySwipeAt) return true;
  const swipedMs = new Date(mySwipeAt).getTime();
  if (Number.isNaN(swipedMs)) return true;
  return now.getTime() - swipedMs >= delayMs;
}

/**
 * Completes due persona swipe-backs for this user. Returns how many matches
 * fired and how many persona responses are still "thinking" — callers use
 * the latter for check-back-soon copy. Cheap no-op for users without demo
 * friends (one indexed query).
 */
export async function triggerDemoSwipeBacks(
  userId: string,
): Promise<{ matched: number; pending: number }> {
  const admin = createAdminClient();

  const { data: rows } = await admin
    .from("hangs")
    .select(
      "id, user_a, user_b, swipe_a, swipe_b, swipe_a_at, swipe_b_at, matched, prompt_copy",
    )
    .eq("matched", false)
    .or(
      `and(user_a.eq.${userId},swipe_a.eq.right,swipe_b.is.null),and(user_b.eq.${userId},swipe_b.eq.right,swipe_a.is.null)`,
    );

  if (!rows || rows.length === 0) return { matched: 0, pending: 0 };

  const otherIds = Array.from(
    new Set(rows.map((r) => (r.user_a === userId ? r.user_b : r.user_a))),
  );
  const { data: demoProfiles } = await admin
    .from("profiles")
    .select("id, display_name, username")
    .in("id", otherIds)
    .eq("is_demo", true);

  const demoIds = new Set((demoProfiles ?? []).map((p) => p.id));
  if (demoIds.size === 0) return { matched: 0, pending: 0 };

  const demoNameById = new Map(
    (demoProfiles ?? []).map((p) => [
      p.id,
      p.display_name ?? p.username ?? "your friend",
    ]),
  );

  const now = new Date();
  const due: typeof rows = [];
  let pending = 0;

  for (const row of rows) {
    const otherId = row.user_a === userId ? row.user_b : row.user_a;
    if (!demoIds.has(otherId)) continue;
    if (isDemoSwipeBackDue(row, userId, demoIds, now)) due.push(row);
    else pending++;
  }

  let matched = 0;
  for (const row of due) {
    const personaIsA = row.user_b === userId;
    const { error } = await admin
      .from("hangs")
      .update(
        personaIsA
          ? { swipe_a: "right" as const, swipe_a_at: now.toISOString(), matched: true }
          : { swipe_b: "right" as const, swipe_b_at: now.toISOString(), matched: true },
      )
      .eq("id", row.id)
      .eq("matched", false);
    if (!error) matched++;
  }

  // Real users get the standard match email (anonymous demo visitors have
  // none, so this returns fast). Capped so it never stalls a page load.
  if (matched > 0) {
    await Promise.race([
      sendDemoMatchEmail(admin, userId, due[0], demoNameById).catch((e) =>
        console.error("demo match email failed", e),
      ),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  }

  return { matched, pending };
}

async function sendDemoMatchEmail(
  admin: AdminClient,
  userId: string,
  hang: { id: string; user_a: string; user_b: string; prompt_copy: string },
  demoNameById: Map<string, string>,
): Promise<void> {
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const toEmail = authUser?.user?.email;
  if (!toEmail) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, username")
    .eq("id", userId)
    .maybeSingle();

  const personaId = hang.user_a === userId ? hang.user_b : hang.user_a;
  await sendMatchEmail({
    toEmail,
    toName: profile?.display_name ?? profile?.username ?? "you",
    friendName: demoNameById.get(personaId) ?? "your friend",
    promptCopy: hang.prompt_copy,
    matchId: hang.id,
  });
}

// ---------------------------------------------------------------------------
// Persona chat replies
// ---------------------------------------------------------------------------

export async function maybeSendPersonaHangReply(
  hangId: string,
  senderId: string,
  content: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: hang } = await admin
    .from("hangs")
    .select("id, user_a, user_b, preference_id")
    .eq("id", hangId)
    .maybeSingle();
  if (!hang) return;

  const otherId = hang.user_a === senderId ? hang.user_b : hang.user_a;
  const persona = await getPersona(admin, otherId);
  if (!persona) return;

  const { data: pref } = await admin
    .from("preference_options")
    .select("label")
    .eq("id", hang.preference_id)
    .maybeSingle();

  const reply = await generatePersonaReply(persona, content, pref?.label ?? null);
  await admin.from("messages").insert({
    hang_id: hangId,
    sender_id: otherId,
    content: reply,
  });
}

export async function maybeSendPersonaFriendReply(
  friendshipId: string,
  senderId: string,
  content: string,
): Promise<void> {
  const admin = createAdminClient();

  const { data: friendship } = await admin
    .from("friendships")
    .select("id, requester_id, addressee_id")
    .eq("id", friendshipId)
    .maybeSingle();
  if (!friendship) return;

  const otherId =
    friendship.requester_id === senderId
      ? friendship.addressee_id
      : friendship.requester_id;
  const persona = await getPersona(admin, otherId);
  if (!persona) return;

  const reply = await generatePersonaReply(persona, content, null);
  await admin.from("friendship_messages").insert({
    friendship_id: friendshipId,
    sender_id: otherId,
    content: reply,
  });
}

type PersonaCharacter = {
  displayName: string;
  vibe: string;
  cannedReplies: string[];
};

async function getPersona(
  admin: AdminClient,
  userId: string,
): Promise<PersonaCharacter | null> {
  const { data: profile } = await admin
    .from("profiles")
    .select("username, display_name")
    .eq("id", userId)
    .eq("is_demo", true)
    .maybeSingle();
  if (!profile) return null;

  const def = DEMO_PERSONAS.find((p) => p.username === profile.username);
  return {
    displayName: profile.display_name ?? def?.displayName ?? "your friend",
    vibe: def?.vibe ?? "friendly and enthusiastic about making plans",
    cannedReplies: def?.cannedReplies ?? [
      "i'm in — when works for you?",
      "yes, let's make it happen",
    ],
  };
}

async function generatePersonaReply(
  persona: PersonaCharacter,
  userMessage: string,
  activityLabel: string | null,
): Promise<string> {
  const fallback =
    persona.cannedReplies[
      Math.floor(Math.random() * persona.cannedReplies.length)
    ];

  if (!process.env.OPENAI_API_KEY) return fallback;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ${persona.displayName}, a San Francisco local chatting with a friend in a hangout-planning app${
            activityLabel
              ? ` about planning to ${activityLabel.toLowerCase()} together`
              : ""
          }. You're ${persona.vibe}. Reply to their message in under 25 words: casual lowercase texting style, warm and specific, at most one emoji. Suggest a concrete day or SF spot when it fits naturally.`,
        },
        { role: "user", content: userMessage.slice(0, 500) },
      ],
      temperature: 0.9,
      max_tokens: 60,
    });

    const reply = res.choices[0]?.message?.content?.trim();
    if (reply && reply.length > 0 && reply.length <= 240) return reply;
    return fallback;
  } catch (error) {
    console.error("persona reply generation failed", error);
    return fallback;
  }
}
