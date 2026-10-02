"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+=?<>/\\";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Returns `text` decoded from random glyphs, left to right. The first render
 * is the real text (no hydration mismatch); scrambling starts on the client.
 */
export function useScramble(text: string, { duration = 900, auto = true } = {}) {
  const [display, setDisplay] = useState(text);
  const frame = useRef(0);

  const run = useCallback(() => {
    cancelAnimationFrame(frame.current);
    const reduced = prefersReducedMotion();
    const start = performance.now();
    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - start) / duration);
      const revealed = Math.floor(progress * text.length);
      setDisplay(
        text
          .split("")
          .map((char, i) =>
            i < revealed || char === " " ? char : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!,
          )
          .join(""),
      );
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [text, duration]);

  useEffect(() => {
    if (auto) run();
    return () => cancelAnimationFrame(frame.current);
  }, [auto, run]);

  return { display, run };
}

type HyperTextProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "span" | "p";
  duration?: number;
  /** Re-scramble on hover. */
  hover?: boolean;
};

/** Text that decodes from random glyphs on mount (and on hover). */
export function HyperText({ text, className, as: Tag = "span", duration, hover = true }: HyperTextProps) {
  const { display, run } = useScramble(text, { duration });
  return (
    <Tag className={className} aria-label={text} onMouseEnter={hover ? run : undefined}>
      <span aria-hidden>{display}</span>
    </Tag>
  );
}

/** Cycles through phrases, scrambling between each. */
export function RoleRotator({ roles, className, interval = 2800 }: { roles: string[]; className?: string; interval?: number }) {
  const [index, setIndex] = useState(0);
  const text = roles[index % Math.max(1, roles.length)] ?? "";
  const { display } = useScramble(text, { duration: 700 });

  useEffect(() => {
    if (roles.length < 2 || prefersReducedMotion()) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % roles.length), interval);
    return () => window.clearInterval(id);
  }, [roles.length, interval]);

  if (!text) return null;
  return (
    <span className={cn("inline-flex items-center", className)} aria-live="polite">
      <span className="sr-only">{text}</span>
      <span aria-hidden>{display}</span>
      <span aria-hidden className="ml-1 inline-block h-[1em] w-[0.55em] translate-y-[0.1em] animate-blink bg-brand" />
    </span>
  );
}
