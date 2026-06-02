"use client";

import Link from "next/link";
import { useState } from "react";
import { acceptFriendRequest, declineFriendRequest, removeFriend } from "./actions";

type FriendProfile = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type AcceptedFriend = FriendProfile & {
  friendshipId: string;
};

export type PendingFriend = FriendProfile & {
  friendshipId: string;
};

type FriendsScreenProps = {
  sent: string | null;
  error: string | null;
  accepted: AcceptedFriend[];
  incomingPending: PendingFriend[];
  outgoingPending: PendingFriend[];
};

const AVATAR_COLORS = [
  { bg: "#DCEEFA", fg: "#4A7FA5" },
  { bg: "#FFE8D6", fg: "#C4703A" },
  { bg: "#E2F0CB", fg: "#4A7A3A" },
  { bg: "#F0E4FA", fg: "#7A4FAA" },
  { bg: "#FFF0CC", fg: "#B07A20" },
  { bg: "#DCEEFA", fg: "#2A6F9A" },
  { bg: "#FFE8D6", fg: "#A0522D" },
  { bg: "#E2F0CB", fg: "#3A6A2A" },
];

export function FriendsScreen({
  sent,
  error,
  accepted,
  incomingPending,
  outgoingPending,
}: FriendsScreenProps) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-[430px]">
      <h1 className="font-[family-name:var(--font-friends-serif)] text-[30px] font-bold leading-none tracking-tight text-[#2D3E4E]">
        Your people.
      </h1>
      <p className="mb-6 mt-1 font-[family-name:var(--font-friends-sans)] text-[13px] leading-snug text-[#8A9CAB]">
        Add a friend to start seeing hangs you&apos;d both say yes to.
      </p>

      {sent && (
        <p className="mb-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-friends-sans)] text-sm text-[#2D3E4E] backdrop-blur-md">
          Request sent to {sent}.
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 font-[family-name:var(--font-friends-sans)] text-sm text-[#EF6458] backdrop-blur-md">
          {error}
        </p>
      )}

      <div className="mb-7 flex gap-3">
        <Link
          href="/friends/invite"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8CC0EB_0%,#6AAAD8_100%)] py-[13px] font-[family-name:var(--font-friends-sans)] text-[13px] font-bold text-white shadow-sm transition active:opacity-80"
        >
          <UserPlusIcon />
          <span>Invite a friend</span>
        </Link>
        <Link
          href="/friends/add"
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-[rgba(140,192,235,0.4)] bg-white/70 py-[13px] font-[family-name:var(--font-friends-sans)] text-[13px] font-bold text-[#4A7FA5] backdrop-blur-md transition active:opacity-70"
        >
          <AtSignIcon />
          <span>Add by username</span>
        </Link>
      </div>

      {incomingPending.length > 0 && (
        <section className="mb-7">
          <h2 className="mb-3 font-[family-name:var(--font-friends-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AACBA]">
            Pending ({incomingPending.length})
          </h2>
          <ul className="space-y-2.5">
            {incomingPending.map((friend, index) => (
              <PendingRow key={friend.friendshipId} friend={friend} index={index} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-friends-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AACBA]">
          Friends ({accepted.length})
        </h2>

        {accepted.length === 0 ? (
          <p className="rounded-2xl border border-white/70 bg-white/60 px-4 py-4 font-[family-name:var(--font-friends-sans)] text-sm text-[#8A9CAB] backdrop-blur-md">
            No friends yet. Send a link or look someone up.
          </p>
        ) : (
          <ul className="space-y-2.5">
            {accepted.map((friend, index) => (
              <FriendRow
                key={friend.friendshipId}
                friend={friend}
                index={index}
                open={openId === friend.friendshipId}
                onToggle={() =>
                  setOpenId((current) =>
                    current === friend.friendshipId ? null : friend.friendshipId,
                  )
                }
              />
            ))}
          </ul>
        )}
      </section>

      {outgoingPending.length > 0 && (
        <section className="mt-7">
          <h2 className="mb-3 font-[family-name:var(--font-friends-sans)] text-[11px] font-bold uppercase tracking-[0.08em] text-[#9AACBA]">
            Sent ({outgoingPending.length})
          </h2>
          <ul className="space-y-2">
            {outgoingPending.map((friend) => (
              <li
                key={friend.friendshipId}
                className="px-1 font-[family-name:var(--font-friends-sans)] text-xs text-[#8A9CAB]"
              >
                waiting on {friend.displayName}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FriendRow({
  friend,
  index,
  open,
  onToggle,
}: {
  friend: AcceptedFriend;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li
      className={`relative flex items-center gap-3 rounded-2xl border px-4 py-3 backdrop-blur-md transition ${
        open
          ? "z-20 border-[rgba(140,192,235,0.35)] bg-white/85 shadow-[0_2px_16px_rgba(140,192,235,0.18)]"
          : "border-white/70 bg-white/60"
      }`}
    >
      <FriendAvatar friend={friend} index={index} />
      <FriendText friend={friend} />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-label={`Open actions for ${friend.displayName}`}
        className={`grid size-8 shrink-0 place-items-center rounded-xl transition active:opacity-70 ${
          open ? "bg-[rgba(140,192,235,0.15)] text-[#6AAAD8]" : "text-[#B8C8D4]"
        }`}
      >
        <MoreHorizontalIcon />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[210px] overflow-hidden rounded-2xl border border-[rgba(140,192,235,0.25)] bg-white/95 shadow-[0_8px_32px_rgba(44,62,78,0.12)] backdrop-blur-2xl">
          <form
            action={removeFriend}
            onSubmit={(event) => {
              if (
                !window.confirm(
                  `Remove ${friend.displayName} from your friends? They won't be notified.`,
                )
              ) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="friendship_id" value={friend.friendshipId} />
            <button
              type="submit"
              className="flex w-full items-center gap-3 px-4 py-[13px] text-left transition active:opacity-70"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[rgba(239,100,88,0.1)] text-[#EF6458]">
                <UserXIcon />
              </span>
              <span className="min-w-0">
                <span className="block font-[family-name:var(--font-friends-sans)] text-[13px] font-bold text-[#EF6458]">
                  Remove friend
                </span>
                <span className="mt-0.5 block font-[family-name:var(--font-friends-sans)] text-[10px] text-[#C4A8A6]">
                  They won&apos;t be notified
                </span>
              </span>
            </button>
          </form>
        </div>
      )}
    </li>
  );
}

function PendingRow({ friend, index }: { friend: PendingFriend; index: number }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-3 backdrop-blur-md">
      <FriendAvatar friend={friend} index={index} />
      <FriendText friend={friend} />
      <form action={declineFriendRequest}>
        <input type="hidden" name="friendship_id" value={friend.friendshipId} />
        <button
          type="submit"
          className="rounded-xl border border-[rgba(140,192,235,0.25)] bg-white/70 px-3 py-2 font-[family-name:var(--font-friends-sans)] text-[11px] font-bold text-[#8A9CAB] transition active:opacity-70"
        >
          Decline
        </button>
      </form>
      <form action={acceptFriendRequest}>
        <input type="hidden" name="friendship_id" value={friend.friendshipId} />
        <button
          type="submit"
          className="rounded-xl bg-[linear-gradient(135deg,#8CC0EB_0%,#6AAAD8_100%)] px-3 py-2 font-[family-name:var(--font-friends-sans)] text-[11px] font-bold text-white transition active:opacity-80"
        >
          Accept
        </button>
      </form>
    </li>
  );
}

function FriendAvatar({
  friend,
  index,
}: {
  friend: FriendProfile;
  index: number;
}) {
  const colors = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initial = friend.displayName.charAt(0).toUpperCase();

  return friend.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={friend.avatarUrl}
      alt=""
      className="size-10 shrink-0 rounded-full object-cover"
    />
  ) : (
    <span
      className="grid size-10 shrink-0 place-items-center rounded-full font-[family-name:var(--font-friends-serif)] text-base font-bold"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
      aria-hidden
    >
      {initial}
    </span>
  );
}

function FriendText({ friend }: { friend: FriendProfile }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="truncate font-[family-name:var(--font-friends-sans)] text-sm font-bold text-[#2D3E4E]">
        {friend.displayName}
      </p>
      <p className="mt-0.5 truncate font-[family-name:var(--font-friends-sans)] text-[11px] text-[#9AACBA]">
        @{friend.username}
      </p>
    </div>
  );
}

function UserPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  );
}

function AtSignIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" />
    </svg>
  );
}

function MoreHorizontalIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

function UserXIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m17 8 5 5" />
      <path d="m22 8-5 5" />
    </svg>
  );
}
