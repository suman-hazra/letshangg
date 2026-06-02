"use client";

import { useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function InviteCard({
  username,
}: {
  username: string;
  displayName: string;
}) {
  const [copied, setCopied] = useState(false);
  const inviteUrl = useMemo(() => {
    const origin =
      typeof window === "undefined" ? "https://letshangg.app" : window.location.origin;
    return `${origin}/i/${username}`;
  }, [username]);
  const displayUrl = inviteUrl.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // older browsers / unsecure contexts — fall through
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col items-center rounded-3xl border border-white/80 bg-white/70 px-6 py-7 shadow-[0_4px_24px_rgba(44,62,78,0.07)] backdrop-blur-xl">
        <div className="mb-4 rounded-2xl bg-white p-4 shadow-[0_1px_8px_rgba(44,62,78,0.08)]">
          <QRCodeSVG
            value={inviteUrl}
            size={200}
            level="M"
            fgColor="#2D3E4E"
            bgColor="#FFFFFF"
          />
        </div>
        <p className="font-[family-name:var(--font-invite-serif)] text-xs italic text-[#AFBEC9]">
          point a camera at me.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center rounded-2xl border-[1.5px] border-[rgba(140,192,235,0.28)] bg-white/75 px-4 py-[13px] backdrop-blur-md">
          <span className="truncate font-[family-name:var(--font-invite-sans)] text-[13px] text-[#6A8FAA]">
            {displayUrl}
          </span>
        </div>
        <button
          type="button"
          onClick={copy}
          className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#8CC0EB_0%,#6AAAD8_100%)] px-5 py-[13px] font-[family-name:var(--font-invite-sans)] text-[13px] font-bold text-white shadow-sm transition active:opacity-80"
        >
          <CopyIcon />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M8 8h11a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2Z" />
      <path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
    </svg>
  );
}
