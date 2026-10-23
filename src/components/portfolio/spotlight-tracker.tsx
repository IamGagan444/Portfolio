"use client";

import { useEffect } from "react";

/**
 * One document-level listener drives every Magic Card spotlight: it writes the
 * pointer position (relative to the hovered card) into CSS variables, at most
 * once per frame. Touch devices never attach it.
 */
export function SpotlightTracker() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    let frame = 0;
    let pending: { el: HTMLElement; x: number; y: number } | null = null;

    const onMove = (e: PointerEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-spotlight]");
      if (!el) return;
      pending = { el, x: e.clientX, y: e.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pending) return;
        const rect = pending.el.getBoundingClientRect();
        pending.el.style.setProperty("--mx", `${pending.x - rect.left}px`);
        pending.el.style.setProperty("--my", `${pending.y - rect.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
    };
  }, []);
  return null;
}
