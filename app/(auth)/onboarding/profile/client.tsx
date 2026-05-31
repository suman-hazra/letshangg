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
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      aria-label={url ? "Change profile photo" : "Add profile photo"}
      className="flex items-center gap-4 transition active:opacity-70 disabled:opacity-60"
    >
      {/* Circle */}
      <div className="relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full border-[2.5px] border-dashed border-[rgba(140,192,235,0.7)] bg-[linear-gradient(150deg,#FFF3C9,#BFDDF0)] shadow-[0_6px_18px_-8px_rgba(140,192,235,0.7)] flex items-center justify-center">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="Your avatar" className="h-full w-full object-cover" />
        ) : (
          <CameraIcon />
        )}
      </div>

      {/* Text */}
      <div className="text-left">
        <p className="font-[family-name:var(--font-landing-sans)] text-[14px] font-bold text-[#284052]">
          {uploading ? "Uploading…" : url ? "Photo added" : "Add a profile photo"}
        </p>
        <p className="mt-0.5 font-[family-name:var(--font-landing-sans)] text-[12px] font-medium text-[#9AACBA]">
          {url ? "tap to change" : "optional · tap to upload"}
        </p>
        {error && (
          <p className="mt-1 font-[family-name:var(--font-landing-sans)] text-[11px] text-danger">
            {error}
          </p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIMES.join(",")}
        onChange={onFile}
        className="sr-only"
      />
    </button>
  );
}

function CameraIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8CC0EB"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
