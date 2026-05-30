import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptFriendRequest, declineFriendRequest } from "./actions";

export default async function FriendsPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("friendships")
    .select("id, requester_id, addressee_id, status")
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const accepted = (rows ?? []).filter((r) => r.status === "accepted");
  const incomingPending = (rows ?? []).filter(
    (r) => r.status === "pending" && r.addressee_id === user.id,
  );
  const outgoingPending = (rows ?? []).filter(
    (r) => r.status === "pending" && r.requester_id === user.id,
  );

  // Resolve display info for all referenced friend ids.
  const friendIds = new Set<string>();
  for (const r of accepted) {
    friendIds.add(r.requester_id === user.id ? r.addressee_id : r.requester_id);
  }
  for (const r of incomingPending) friendIds.add(r.requester_id);
  for (const r of outgoingPending) friendIds.add(r.addressee_id);

  const profileById = new Map<
    string,
    { display_name: string | null; username: string }
  >();
  if (friendIds.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", Array.from(friendIds));
    for (const p of profiles ?? []) {
      profileById.set(p.id, {
        display_name: p.display_name,
        username: p.username,
      });
    }
  }

  return (
    <main className="flex-1 flex flex-col items-center px-6 pb-12">
      <div className="w-full max-w-[430px]">
        <h1 className="mt-4 font-serif text-3xl text-ink leading-tight">
          Your people.
        </h1>
        <p className="mt-2 font-sans text-sm text-muted">
          Add a friend to start seeing hangs you&apos;d both say yes to.
        </p>

        {/* Toast on send success */}
        {sent && (
          <p className="mt-4 font-sans text-sm text-ink bg-accent-soft rounded-2xl px-4 py-3">
            Request sent to {decodeURIComponent(sent)}.
          </p>
        )}
        {error && (
          <p className="mt-4 font-sans text-sm text-danger bg-surface border border-line rounded-2xl px-4 py-3">
            {decodeURIComponent(error)}
          </p>
        )}

        {/* CTAs */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/friends/invite"
            className="h-12 rounded-full bg-ink text-surface flex items-center justify-center font-sans text-sm font-semibold transition hover:opacity-90"
          >
            Invite a friend
          </Link>
          <Link
            href="/friends/add"
            className="h-12 rounded-full bg-surface border border-line text-ink flex items-center justify-center font-sans text-sm font-semibold transition hover:bg-accent-soft"
          >
            Add by username
          </Link>
        </div>

        {/* Pending requests */}
        {incomingPending.length > 0 && (
          <section className="mt-10">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted">
              Pending
            </h2>
            <ul className="mt-3 space-y-3">
              {incomingPending.map((r) => {
                const p = profileById.get(r.requester_id);
                const name = p?.display_name ?? p?.username ?? "someone";
                return (
                  <li
                    key={r.id}
                    className="rounded-2xl bg-surface border border-line px-4 py-3 flex items-center gap-3"
                  >
                    <Avatar name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-ink truncate">
                        {name}
                      </p>
                      <p className="font-sans text-xs text-muted truncate">
                        @{p?.username}
                      </p>
                    </div>
                    <form action={declineFriendRequest}>
                      <input type="hidden" name="friendship_id" value={r.id} />
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-full bg-surface border border-line text-ink text-xs font-semibold"
                      >
                        Decline
                      </button>
                    </form>
                    <form action={acceptFriendRequest}>
                      <input type="hidden" name="friendship_id" value={r.id} />
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-full bg-ink text-surface text-xs font-semibold"
                      >
                        Accept
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Friends list */}
        <section className="mt-10">
          <h2 className="font-sans text-xs tracking-widest uppercase text-muted">
            Friends ({accepted.length})
          </h2>
          {accepted.length === 0 ? (
            <p className="mt-3 font-sans text-sm text-muted">
              No friends yet. Send a link or look someone up.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {accepted.map((r) => {
                const friendId =
                  r.requester_id === user.id ? r.addressee_id : r.requester_id;
                const p = profileById.get(friendId);
                const name = p?.display_name ?? p?.username ?? "your friend";
                return (
                  <li
                    key={r.id}
                    className="rounded-2xl bg-surface border border-line px-4 py-3 flex items-center gap-3"
                  >
                    <Avatar name={name} />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm font-semibold text-ink truncate">
                        {name}
                      </p>
                      <p className="font-sans text-xs text-muted truncate">
                        @{p?.username}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Outgoing pending — light footer */}
        {outgoingPending.length > 0 && (
          <section className="mt-10">
            <h2 className="font-sans text-xs tracking-widest uppercase text-muted">
              Sent
            </h2>
            <ul className="mt-3 space-y-2">
              {outgoingPending.map((r) => {
                const p = profileById.get(r.addressee_id);
                const name = p?.display_name ?? p?.username ?? "someone";
                return (
                  <li
                    key={r.id}
                    className="font-sans text-xs text-muted px-1"
                  >
                    waiting on {name}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="inline-flex h-10 w-10 rounded-full bg-accent-soft items-center justify-center font-serif text-base text-ink"
    >
      {initial}
    </span>
  );
}
