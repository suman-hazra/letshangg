/**
 * Single source of truth for rendering a user's avatar in the app.
 * Real photo when avatar_url is set, initials-on-tinted-circle otherwise.
 */

const SIZE_CLASSES = {
  sm: "h-10 w-10 text-base",
  md: "h-14 w-14 text-2xl",
  lg: "h-16 w-16 text-2xl",
} as const;

type Size = keyof typeof SIZE_CLASSES;

export function Avatar({
  name,
  url,
  size = "md",
  ariaLabel,
}: {
  name: string;
  url?: string | null;
  size?: Size;
  ariaLabel?: string;
}) {
  const initial = (name || "?").charAt(0).toUpperCase();
  const cls = SIZE_CLASSES[size];

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={ariaLabel ?? `${name} avatar`}
        className={`${cls} rounded-full object-cover bg-accent-soft`}
      />
    );
  }

  return (
    <span
      aria-label={ariaLabel ?? `${name} avatar`}
      role="img"
      className={`${cls} rounded-full bg-accent-soft inline-flex items-center justify-center font-serif text-ink shrink-0`}
    >
      {initial}
    </span>
  );
}
