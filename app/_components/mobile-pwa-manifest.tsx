"use client";

import { useEffect } from "react";

const MANIFEST_HREF = "/manifest.webmanifest";
const MOBILE_MEDIA = "(max-width: 767px)";

export function MobilePwaManifest() {
  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_MEDIA);

    const syncManifestLink = () => {
      const existing = document.head.querySelector<HTMLLinkElement>(
        `link[rel="manifest"][href="${MANIFEST_HREF}"]`,
      );

      if (!mediaQuery.matches) {
        existing?.remove();
        return;
      }

      if (existing) return;

      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = MANIFEST_HREF;
      document.head.appendChild(link);
    };

    syncManifestLink();
    mediaQuery.addEventListener("change", syncManifestLink);

    return () => {
      mediaQuery.removeEventListener("change", syncManifestLink);
      document.head
        .querySelector<HTMLLinkElement>(
          `link[rel="manifest"][href="${MANIFEST_HREF}"]`,
        )
        ?.remove();
    };
  }, []);

  return null;
}
