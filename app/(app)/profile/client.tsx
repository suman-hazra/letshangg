"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveAvatarUrl } from "./actions";

const MAX_BYTES = 2_000_000; // 2 MB
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarEditor({
  userId,
  initialUrl,
  initial,
}: {
  userId: string;
  initialUrl: string | null;
  initial: string;
}) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFile() {
    inputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // reset so picking the same file again still fires
    if (!file) return;

    if (!ACCEPTED_MIMES.includes(file.type)) {
      setError("Photo must be a JPG, PNG, or WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Photo must be under 2 MB.");
      return;
    }
    setError(null);

    startUpload(async () => {
      const supabase = createClient();
      // Path: <userId>/avatar.<ext> — overwrite on every upload.
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${userId}/avatar.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "60",
          upsert: true,
          contentType: file.type,
        });

      if (upErr) {
        setError(upErr.message);
        return;
      }

      const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
      // Bust caches for the same path by appending a version query param.
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      // Persist to profiles.avatar_url via server action.
      const fd = new FormData();
      fd.set("avatar_url", publicUrl);
      await saveAvatarUrl(fd);

      setUrl(publicUrl);
    });
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        aria-label={url ? "Change photo" : "Add photo"}
        className="relative h-28 w-28 rounded-full bg-accent-soft overflow-hidden flex items-center justify-center transition hover:opacity-90 disabled:opacity-60"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Your avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-serif text-5xl text-ink">{initial}</span>
        )}
        <span className="absolute bottom-1 right-1 h-7 w-7 rounded-full bg-ink text-surface flex items-center justify-center">
          <PencilIcon />
        </span>
      </button>

      <p className="mt-3 font-sans text-xs text-muted">
        {uploading ? "uploading…" : "tap to change"}
      </p>
      {error && (
        <p className="mt-2 font-sans text-xs text-danger">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIMES.join(",")}
        onChange={onFile}
        className="sr-only"
      />
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}
