"use client";

import { AnimatePresence, motion } from "framer-motion";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

const subscribe = () => () => {};

/**
 * Theme switch that reveals the new theme as a circle expanding from the
 * button (View Transitions API, à la Magic UI "Animated Theme Toggler").
 * Falls back to an instant switch where unsupported or with reduced motion.
 */
export function AnimatedThemeToggler({ className, ref: forwardedRef, onClick, ...props }: React.ComponentProps<"button">) {
  const { resolvedTheme, setTheme } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);
  // Theme is unknown during SSR; render a stable icon until mounted.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = mounted ? resolvedTheme !== "light" : true;

  // Tooltip triggers (asChild) pass their own ref; keep ours too.
  const setRef = (node: HTMLButtonElement | null) => {
    ref.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  const toggle = async (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    const next = isDark ? "light" : "dark";
    const canAnimate =
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canAnimate || !ref.current) {
      setTheme(next);
      return;
    }

    const { top, left, width, height } = ref.current.getBoundingClientRect();
    const x = left + width / 2;
    const y = top + height / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });
    await transition.ready;
    document.documentElement.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(0.65, 0, 0.35, 1)", pseudoElement: "::view-transition-new(root)" },
    );
  };

  return (
    <button
      {...props}
      ref={setRef}
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative inline-flex size-9 items-center justify-center overflow-hidden rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "moon" : "sun"}
          initial={{ y: 14, rotate: -90, opacity: 0 }}
          animate={{ y: 0, rotate: 0, opacity: 1 }}
          exit={{ y: -14, rotate: 90, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="flex"
        >
          {isDark ? <MoonIcon className="size-4" /> : <SunIcon className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
