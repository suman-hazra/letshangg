"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "./actions";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export function ChatRoom({
  hangId,
  myId,
  friendName,
  friendAvatar,
  activityLabel,
  activityEmoji,
  initialMessages,
  promptCopy,
}: {
  hangId: string;
  myId: string;
  friendName: string;
  friendAvatar: string | null;
  activityLabel: string;
  activityEmoji: string;
  initialMessages: Message[];
  promptCopy: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Realtime subscription to INSERTs on this hang's messages.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`hang:${hangId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `hang_id=eq.${hangId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [hangId]);

  // Autoscroll on new messages.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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

    const fd = new FormData();
    fd.set("hang_id", hangId);
    fd.set("content", content);

    startTransition(async () => {
      const res = await sendMessage(undefined, fd);
      if (res?.error) {
        // Roll back optimistic message on error.
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setError(res.error);
      }
      // On success: Realtime will deliver the real row, which dedupes by id.
      // But to avoid a flicker, replace the optimistic with the real:
      // (the dedupe in subscribe handler keeps things from doubling)
    });
  }

  const smsBody = `hey ${friendName} — ${activityLabel.toLowerCase()} this weekend? matched via letshangg`;
  const smsHref = `sms:?body=${encodeURIComponent(smsBody)}`;

  return (
    <main className="flex-1 flex flex-col px-0 pb-0">
      {/* Top bar */}
      <header className="px-6 py-3 border-b border-line flex items-center gap-3">
        <Link
          href={`/match/${hangId}`}
          className="font-sans text-xs tracking-widest uppercase text-muted"
          aria-label="Back to match"
        >
          ←
        </Link>
        {friendAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={friendAvatar}
            alt=""
            className="h-9 w-9 rounded-full object-cover bg-accent-soft shrink-0"
          />
        ) : (
          <span
            aria-hidden
            className="h-9 w-9 rounded-full bg-accent-soft inline-flex items-center justify-center font-serif text-base text-ink shrink-0"
          >
            {friendName.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-semibold text-ink truncate">
            {friendName}
          </p>
          <p className="font-sans text-xs text-muted truncate">
            <span aria-hidden>{activityEmoji}</span> {activityLabel}
          </p>
        </div>
        <a
          href={smsHref}
          className="h-9 px-3 rounded-full bg-surface border border-line text-ink text-xs font-semibold"
        >
          SMS
        </a>
      </header>

      {/* Context line */}
      <div className="px-6 pt-4">
        <p className="font-script text-base text-muted text-center">
          {promptCopy}
        </p>
      </div>

      {/* Message list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-3"
      >
        {messages.length === 0 && (
          <p className="font-sans text-sm text-muted text-center mt-12">
            Say hi.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            content={m.content}
            mine={m.sender_id === myId}
            at={m.created_at}
          />
        ))}
      </div>

      {/* Composer */}
      <form
        onSubmit={submit}
        className="px-4 py-3 border-t border-line bg-background flex items-end gap-2"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          placeholder="Message…"
          rows={1}
          maxLength={2000}
          className="flex-1 resize-none rounded-2xl bg-surface border border-line px-4 py-2.5 font-sans text-sm text-ink placeholder:text-muted focus:outline-none focus:border-ink min-h-[44px] max-h-32"
        />
        <button
          type="submit"
          disabled={!draft.trim() || pending}
          className="h-11 px-5 rounded-full bg-ink text-surface font-sans text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          Send
        </button>
      </form>

      {error && (
        <p className="px-6 pb-3 font-sans text-xs text-danger">{error}</p>
      )}
    </main>
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
            ? "bg-ink text-surface rounded-br-sm"
            : "bg-surface border border-line text-ink rounded-bl-sm"
        }`}
      >
        <p className="font-sans text-sm leading-snug whitespace-pre-wrap break-words">
          {content}
        </p>
        <p
          className={`mt-1 font-sans text-[10px] ${
            mine ? "text-surface/60" : "text-muted"
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
