"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { runHangManager } from "./actions";

const MIN_DURATION_MS = 1800;
const SOFT_TIMEOUT_MS = 6000;

export function FindingHangsClient() {
  const router = useRouter();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const start = Date.now();
    const work = runHangManager().catch(() => undefined);
    const minWait = new Promise((r) => setTimeout(r, MIN_DURATION_MS));
    const softTimeout = new Promise((r) => setTimeout(r, SOFT_TIMEOUT_MS));

    // Wait for hang manager + min duration, or soft timeout, whichever comes first.
    Promise.race([Promise.all([work, minWait]), softTimeout]).then(() => {
      const elapsed = Date.now() - start;
      // Floor the elapsed time to MIN_DURATION_MS for the anticipation feel.
      const remaining = Math.max(0, MIN_DURATION_MS - elapsed);
      setTimeout(() => router.replace("/home"), remaining);
    });
  }, [router]);

  return null;
}
