"use client";

import { animate, motion, useInView, useMotionValue, useScroll, useSpring, useTransform } from "framer-motion";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Card with a pointer-following spotlight and glowing border (Magic UI "Magic Card"). */
export function MagicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      onPointerMove={(e) => {
        const rect = ref.current!.getBoundingClientRect();
        ref.current!.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        ref.current!.style.setProperty("--my", `${e.clientY - rect.top}px`);
      }}
      className={cn(
        "group/magic relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-sm transition-colors",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:opacity-0 before:transition-opacity before:duration-300 hover:before:opacity-100",
        "before:bg-[radial-gradient(420px_circle_at_var(--mx,50%)_var(--my,50%),hsl(var(--brand)/0.12),transparent_60%)]",
        "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:p-px after:opacity-0 after:transition-opacity after:duration-300 hover:after:opacity-100",
        "after:bg-[radial-gradient(260px_circle_at_var(--mx,50%)_var(--my,50%),hsl(var(--brand)/0.7),transparent_70%)]",
        "after:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** An animated light travelling around the parent's border (Magic UI "Border Beam"). */
export function BorderBeam({ duration = 7 }: { duration?: number }) {
  return (
    <span
      aria-hidden
      style={{ "--beam-duration": `${duration}s` } as React.CSSProperties}
      className="pointer-events-none absolute inset-0 rounded-[inherit] p-px animate-border-beam [background:conic-gradient(from_var(--beam-angle),transparent_0deg,transparent_280deg,hsl(var(--brand))_340deg,transparent_360deg)] [mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)]"
    />
  );
}

/** Infinite horizontal scroller; pauses on hover. */
export function Marquee({
  children,
  reverse,
  duration = 40,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("group flex overflow-hidden mask-fade-x [--gap:0.75rem] [gap:var(--gap)]", className)}
      style={{ "--duration": `${duration}s` } as React.CSSProperties}
    >
      {[0, 1].map((copy) => (
        <div
          key={copy}
          aria-hidden={copy === 1}
          className={cn(
            "flex shrink-0 items-center [gap:var(--gap)] group-hover:[animation-play-state:paused] motion-reduce:animate-none",
            reverse ? "animate-marquee-reverse" : "animate-marquee"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/** Counts up to `value` when scrolled into view. */
export function NumberTicker({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, value, { duration: 1.6, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, value, count]);

  return (
    <motion.span ref={ref} className="tabular-nums">
      {rounded}
    </motion.span>
  );
}

/** Thin brand-coloured reading progress bar. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.2 });
  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-50 h-px origin-left bg-gradient-to-r from-transparent via-brand to-brand"
    />
  );
}

/** Fades/lifts content in when it enters the viewport. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const Component = as === "li" ? motion.li : motion.div;
  return (
    <Component
      initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Component>
  );
}

/** Live clock for a timezone, e.g. "3:42 PM". */
export function LocalTime({ timeZone = "Asia/Kolkata" }: { timeZone?: string }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
    const update = () => setTime(fmt.format(new Date()));
    update();
    const id = window.setInterval(update, 15_000);
    return () => window.clearInterval(id);
  }, [timeZone]);
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

/** Copies the email address; falls back to mailto when clipboard isn't available. */
export function CopyEmail({ email, className }: { email: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(email);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1800);
        } catch {
          window.location.href = `mailto:${email}`;
        }
      }}
      className={cn(
        "group inline-flex items-center gap-3 rounded-full border bg-card/60 px-5 py-3 font-mono text-sm transition-colors hover:border-brand/60 hover:text-foreground",
        className
      )}
      aria-label={copied ? "Email copied" : `Copy email ${email}`}
    >
      {email}
      {copied ? <CheckIcon className="size-4 text-brand" /> : <CopyIcon className="size-4 text-muted-foreground group-hover:text-foreground" />}
    </button>
  );
}

/** Video that only plays while visible (keeps the homepage light). */
export function LazyVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!video.src) video.src = src;
          void video.play().catch(() => undefined);
        } else video.pause();
      },
      { rootMargin: "120px" }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);
  return <video ref={ref} muted loop playsInline preload="none" className={className} />;
}
