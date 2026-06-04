"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { markFriendMessagesRead, sendFriendMessage } from "./actions";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function FriendChatRoom({
  friendshipId,
  myId,
  friendName,
  friendAvatar,
  initialMessages,
}: {
  friendshipId: string;
  myId: string;
  friendName: string;
  friendAvatar: string | null;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    void markFriendMessagesRead(friendshipId).then(() => router.refresh());
  }, [friendshipId, router]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`friendship:${friendshipId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendship_messages",
          filter: `friendship_id=eq.${friendshipId}`,
        },
        (payload) => {
          const message = payload.new as Message;
          setMessages((prev) =>
            prev.some((item) => item.id === message.id)
              ? prev
              : [...prev, message],
          );
          if (message.sender_id !== myId) {
            void markFriendMessagesRead(friendshipId).then(() =>
              router.refresh(),
            );
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [friendshipId, myId, router]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim() || pending) return;

    const content = draft;
    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: myId,
      content,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    setError(null);

    const formData = new FormData();
    formData.set("friendship_id", friendshipId);
    formData.set("content", content);

    startTransition(async () => {
      const result = await sendFriendMessage(undefined, formData);
      if (result?.error) {
        setMessages((prev) => prev.filter((message) => message.id !== tempId));
        setError(result.error);
      }
    });
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col px-0 pb-0">
      <header className="flex h-[58px] shrink-0 items-center gap-3 border-b border-[rgba(140,192,235,0.22)] bg-white/55 px-6 backdrop-blur-2xl">
        <Link
          href="/friends"
          className="grid h-9 w-6 shrink-0 place-items-center text-[#6AAAD8] transition active:opacity-60"
          aria-label="Back to friends"
        >
          <BackIcon />
        </Link>
        <ChatAvatar name={friendName} url={friendAvatar} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-chat-sans)] text-[16px] font-bold text-[#2D3E4E]">
            {friendName}
          </p>
        </div>
      </header>

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <div className="flex min-h-full flex-col items-center justify-center pb-20 text-center">
            <ChatAvatar name={friendName} url={friendAvatar} size="lg" />
            <p className="mt-4 font-[family-name:var(--font-chat-sans)] text-[16px] font-bold text-[#2D3E4E]">
              {friendName}
            </p>
            <p className="mt-5 font-[family-name:var(--font-chat-serif)] text-[14px] italic text-[#9AACBA]">
              Say hi.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            mine={message.sender_id === myId}
            at={message.created_at}
          />
        ))}
      </div>

      <form
        onSubmit={submit}
        className="flex shrink-0 items-end gap-2 border-t border-[rgba(140,192,235,0.22)] bg-white/45 px-4 py-3 backdrop-blur-2xl"
      >
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              (event.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          placeholder="Message…"
          rows={1}
          maxLength={2000}
          className="min-h-[50px] max-h-32 flex-1 resize-none rounded-[24px] border border-[rgba(140,192,235,0.22)] bg-white/90 px-5 py-3.5 font-[family-name:var(--font-chat-sans)] text-[16px] text-[#2D3E4E] placeholder:text-[#B0C2CF] shadow-[0_4px_18px_rgba(44,62,78,0.06)] focus:border-[#8CC0EB] focus:outline-none"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          className="grid h-[48px] w-[48px] shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] text-white shadow-[0_8px_20px_rgba(108,170,216,0.35)] transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Send message"
        >
          <SendIcon />
        </button>
      </form>

      {error && (
        <p className="bg-white/45 px-6 pb-3 font-[family-name:var(--font-chat-sans)] text-xs text-[#EF6458]">
          {error}
        </p>
      )}
    </main>
  );
}

function ChatAvatar({
  name,
  url,
  size,
}: {
  name: string;
  url: string | null;
  size: "sm" | "lg";
}) {
  const avatarSize = size === "lg" ? "h-[72px] w-[72px]" : "h-10 w-10";
  const textSize = size === "lg" ? "text-[30px]" : "text-[16px]";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={`${avatarSize} shrink-0 rounded-full border-[3px] border-white object-cover shadow-[0_4px_14px_rgba(44,62,78,0.12)]`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`${avatarSize} ${textSize} grid shrink-0 place-items-center rounded-full border-[3px] border-white bg-[#DCEEFA] font-[family-name:var(--font-chat-serif)] font-bold text-[#4A7FA5] shadow-[0_4px_14px_rgba(44,62,78,0.12)]`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function MessageBubble({
  content,
  mine,
  at,
}: {
  content: string;
  mine: boolean;
  at: string;
}) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
          mine
            ? "rounded-br-sm bg-[linear-gradient(135deg,#8CC0EB,#6AAAD8)] text-white"
            : "rounded-bl-sm border border-[rgba(140,192,235,0.22)] bg-white/85 text-[#2D3E4E]"
        }`}
      >
        <p className="whitespace-pre-wrap break-words font-[family-name:var(--font-chat-sans)] text-sm leading-snug">
          {content}
        </p>
        <p
          className={`mt-1 font-[family-name:var(--font-chat-sans)] text-[10px] ${
            mine ? "text-white/70" : "text-[#9AACBA]"
          }`}
        >
          {formatTime(at)}
        </p>
      </div>
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function BackIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
      <path d="M21 12H9" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
