"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowUpRightIcon } from "lucide-react";
import { useEffect, useState } from "react";

type CursorMode = "arrow" | "interactive" | "view" | "grab" | "crosshair" | "hidden";
type CursorState = { mode: CursorMode; label: string };

const INTERACTIVE = "a, button, [role='button'], label, summary, select";
const TEXT_ENTRY = "input, textarea, select, [contenteditable='true']";

function resolveState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return { mode: "arrow", label: "" };
  if (target.closest(TEXT_ENTRY)) return { mode: "hidden", label: "" };
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) {
    const mode = tagged.dataset.cursor as CursorMode;
    return { mode, label: tagged.dataset.cursorLabel ?? "" };
  }
  if (target.closest(INTERACTIVE)) return { mode: "interactive", label: "" };
  return { mode: "arrow", label: "" };
}

/**
 * Spring-smoothed custom cursor (Magic UI "Smooth Cursor") that morphs per
 * context like Magic UI "Pointer": an arrow that leans into its motion, a
 * "View" pill over project cards, a grab ring over the globe and a reticle
 * over the ASCII portrait. Only on fine pointers without reduced motion.
 */
export function SmoothCursor() {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState<CursorState>({ mode: "arrow", label: "" });
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const rotate = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 520, damping: 40, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 520, damping: 40, mass: 0.6 });
  const sRotate = useSpring(rotate, { stiffness: 220, damping: 26 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduced.matches);
    update();
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");

    let lastX = 0;
    let lastY = 0;
    let lastAngle = 0;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x.set(e.clientX);
      y.set(e.clientY);
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.hypot(dx, dy) > 3) {
        // Arrow points up-left at rest; lean it into the direction of travel.
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
        while (angle - lastAngle > 180) angle -= 360;
        while (angle - lastAngle < -180) angle += 360;
        lastAngle = angle;
        rotate.set(angle * 0.18);
      }
      lastX = e.clientX;
      lastY = e.clientY;
      setState((prev) => {
        const next = resolveState(e.target);
        return prev.mode === next.mode && prev.label === next.label ? prev : next;
      });
      setVisible(true);
    };
    // Content can move under a still pointer (scrolling); re-check what's underneath.
    const onScroll = () => {
      const under = document.elementFromPoint(lastX, lastY);
      setState((prev) => {
        const next = resolveState(under);
        return prev.mode === next.mode && prev.label === next.label ? prev : next;
      });
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    return () => {
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled, x, y, rotate]);

  if (!enabled) return null;
  const { mode, label } = state;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100]"
      style={{ x: sx, y: sy, opacity: visible && mode !== "hidden" ? 1 : 0 }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {mode === "view" ? (
          <motion.div
            key="view"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: pressed ? 0.9 : 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="-translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-brand px-4 py-2 font-mono text-xs font-medium text-brand-foreground shadow-[0_10px_30px_-8px_hsl(var(--brand)/0.7)]"
          >
            <span className="flex items-center gap-1.5">
              {label || "View"} <ArrowUpRightIcon className="size-3.5" />
            </span>
          </motion.div>
        ) : mode === "grab" || mode === "crosshair" ? (
          <motion.div
            key={mode}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: pressed ? 0.8 : 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="relative -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative flex size-12 items-center justify-center rounded-full border border-brand/80 backdrop-invert-0">
              {mode === "crosshair" ? (
                <>
                  <span className="absolute h-px w-3 bg-brand" />
                  <span className="absolute h-3 w-px bg-brand" />
                </>
              ) : (
                <span className="size-1.5 rounded-full bg-brand" />
              )}
            </div>
            {label && (
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md border bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground backdrop-blur">
                {label}
              </span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="arrow"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: pressed ? 0.85 : mode === "interactive" ? 1.25 : 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            style={{ rotate: sRotate }}
            className="-translate-x-[3px] -translate-y-[2px] origin-[3px_2px]"
          >
            <svg width="24" height="26" viewBox="0 0 24 26" fill="none" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
              <path
                d="M2.4 1.6 21 10.2c.9.4.8 1.7-.1 2l-7.4 2.3c-.3.1-.6.4-.7.7L10.5 22.6c-.3.9-1.6 1-2 .1L1 3c-.4-.9.5-1.8 1.4-1.4Z"
                className={mode === "interactive" ? "fill-brand stroke-background" : "fill-foreground stroke-background"}
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
