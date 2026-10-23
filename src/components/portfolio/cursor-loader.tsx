"use client";

import dynamic from "next/dynamic";

import { useMediaQuery } from "./use-device";

// Downloaded only on mouse/trackpad devices; phones never fetch this code.
const SmoothCursor = dynamic(() => import("./smooth-cursor").then((m) => m.SmoothCursor), { ssr: false });

export function CursorLoader() {
  const fine = useMediaQuery("(pointer: fine) and (prefers-reduced-motion: no-preference)");
  return fine ? <SmoothCursor /> : null;
}
