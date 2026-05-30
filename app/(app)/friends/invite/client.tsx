"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function InviteCard({
  username,
  displayName,
}: {
  username: string;
  displayName: string;
}) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const inviteUrl = origin ? `${origin}/i/${username}` : `/i/${username}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // older browsers / unsecure contexts — fall through
    }
  }

  async function share() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: "letshangg",
          text: `${displayName} wants to hang on letshangg — tap to add each other`,
          url: inviteUrl,
        });
      } catch {
        // user dismissed share sheet — ignore
      }
    } else {
      copy();
    }
  }

  return (
    <div className="mt-8">
      {/* QR card */}
      <div className="rounded-2xl bg-surface border border-line p-6 flex flex-col items-center">
        <div className="rounded-xl bg-background p-3">
          <QRCodeSVG
            value={inviteUrl}
            size={208}
            level="M"
            fgColor="#1A1714"
            bgColor="#F7F5F2"
          />
        </div>
        <p className="mt-4 font-script text-xl text-muted">
          point a camera at me.
        </p>
      </div>

      {/* URL with copy */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-12 px-4 rounded-2xl bg-surface border border-line flex items-center font-sans text-sm text-ink truncate">
          {inviteUrl.replace(/^https?:\/\//, "")}
        </div>
        <button
          type="button"
          onClick={copy}
          className="h-12 px-5 rounded-full bg-ink text-surface font-sans text-sm font-semibold transition hover:opacity-90 shrink-0"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Share-sheet (mobile mainly) */}
      <button
        type="button"
        onClick={share}
        className="mt-3 w-full h-12 rounded-full bg-surface border border-line text-ink font-sans text-sm font-semibold transition hover:bg-accent-soft"
      >
        Share
      </button>
    </div>
  );
}
