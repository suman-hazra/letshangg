"use client";

import { useEffect, useRef } from "react";
import { markSeen } from "./actions";

export function SeenMarker({ hangId }: { hangId: string }) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    void markSeen(hangId);
  }, [hangId]);
  return null;
}
