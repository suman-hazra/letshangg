"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveOnboardingAvatar } from "./actions";

const MAX_BYTES = 2_000_000;
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp"];

export function OnboardingAvatarUploader({ userId }: { userId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, startUpload] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
      const publicUrl = `${pub.publicUrl}?v=${Date.now()}`;

      const fd = new FormData();
      fd.set("avatar_url", publicUrl);
      await saveOnboardingAvatar(fd);

      setUrl(publicUrl);
    });
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label={url ? "Change photo" : "Add photo"}
        className="relative h-24 w-24 rounded-full bg-accent-soft border-2 border-dashed border-accent overflow-hidden flex items-center justify-center transition hover:opacity-90 disabled:opacity-60"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Your avatar" className="h-full w-full object-cover" />
        ) : (
          <CameraIcon />
        )}
        {url && (
          <span className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-ink text-surface flex items-center justify-center">
            <PencilIcon />
          </span>
        )}
      </button>

      <p className="mt-2 font-sans text-xs text-muted">
        {uploading ? "uploading…" : url ? "tap to change" : "add a photo (optional)"}
      </p>
      {error && (
        <p className="mt-1.5 font-sans text-xs text-danger">{error}</p>
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

function CameraIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="11"
      height="11"
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
