"use client";

import { useRef, useState, useTransition } from "react";
import { deleteProfile, uploadAvatar } from "./actions";

const MAX_BYTES = 2_000_000; // 2 MB
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "image/webp"];

export function AvatarEditor({
  initialUrl,
  initial,
}: {
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
      const fd = new FormData();
      fd.set("photo", file);
      const result = await uploadAvatar(fd);

      if (result.error) {
        setError(result.error);
        return;
      }

      setUrl(result.url ?? null);
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={pickFile}
        disabled={uploading}
        aria-label={url ? "Change photo" : "Add photo"}
        className="relative flex size-[90px] items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(140,192,235,0.28)] bg-[rgba(140,192,235,0.18)] transition active:opacity-70 disabled:opacity-60"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Your avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-[family-name:var(--font-you-serif)] text-[34px] font-semibold text-[#4A7FA5]">
            {initial}
          </span>
        )}
        <span className="absolute bottom-0 right-0 flex size-7 items-center justify-center rounded-full bg-[#8CC0EB] text-white">
          <CameraIcon />
        </span>
      </button>

      <p className="font-[family-name:var(--font-you-sans)] text-[11px] font-medium text-[#9AACBA]">
        {uploading ? "uploading…" : "tap to change"}
      </p>
      {error && (
        <p className="font-[family-name:var(--font-you-sans)] text-xs text-danger">
          {error}
        </p>
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

export function DeleteProfileForm() {
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(event) => {
        if (
          !window.confirm(
            "Delete your account? This permanently removes your profile and data.",
          )
        ) {
          event.preventDefault();
        }
      }}
      action={(formData) => startTransition(() => deleteProfile(formData))}
      className="contents"
    >
      <input type="hidden" name="confirmation" value="delete" />
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition active:opacity-70 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-[rgba(239,100,88,0.1)] text-[#EF6458]">
          <TrashIcon />
        </span>
        <span className="min-w-0">
          <span className="block font-[family-name:var(--font-you-sans)] text-sm font-semibold text-[#EF6458]">
            {pending ? "Deleting account" : "Delete account"}
          </span>
          <span className="mt-0.5 block font-[family-name:var(--font-you-sans)] text-[11px] text-[#BBABA9]">
            Permanently removes your profile and data
          </span>
        </span>
      </button>
    </form>
  );
}

function CameraIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M3.5 8.5A2.5 2.5 0 0 1 6 6h1.2l1.2-1.5h7.2L16.8 6H18a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 16H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
