"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { videoSources } from "@/lib/upload-limits";

import { isLowPowerDevice } from "./use-device";
import { cn } from "@/lib/utils";

/** Counts up to `value` when scrolled into view (vanilla rAF, no animation library). */
export function NumberTicker({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1400);
          const eased = 1 - Math.pow(1 - t, 4);
          el.textContent = `${Math.round(value * eased)}${suffix}`;
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { rootMargin: "-40px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, suffix]);

  // Server-rendered final value: correct without JS and for crawlers.
  return (
    <span ref={ref} className="tabular-nums">
      {`${value}${suffix}`}
    </span>
  );
}

/** Live clock for a timezone, e.g. "3:42 PM". */
export function LocalTime({ timeZone = "Asia/Kolkata", showZone = false }: { timeZone?: string; showZone?: boolean }) {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone });
    // en-IN names Indian time "IST"; en-US would print "GMT+5:30". Other zones read fine either way.
    const zoneFmt = new Intl.DateTimeFormat(timeZone === "Asia/Kolkata" ? "en-IN" : "en-US", {
      timeZone,
      timeZoneName: "short",
    });
    const update = () => {
      const now = new Date();
      const zone = zoneFmt.formatToParts(now).find((p) => p.type === "timeZoneName")?.value;
      setTime(showZone && zone ? `${fmt.format(now)} ${zone}` : fmt.format(now));
    };
    update();
    const id = window.setInterval(update, 15_000);
    return () => window.clearInterval(id);
  }, [timeZone, showZone]);
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
    let loaded = false;
    // Phones / data-saver: show the first frame only — no multi-MB autoplay on cellular.
    const saveData = Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
    const stillFrame = saveData || isLowPowerDevice();
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (stillFrame) {
            if (!loaded) {
              const first = video.querySelector("source");
              video.preload = "metadata";
              video.src = `${first?.dataset.src ?? src}#t=0.1`;
              loaded = true;
            }
            return;
          }
          if (!loaded) {
            // Attach sources only when visible; the browser falls back to the next one on error.
            for (const source of video.querySelectorAll("source")) source.src = source.dataset.src ?? "";
            video.load();
            loaded = true;
          }
          void video.play().catch(() => undefined);
        } else video.pause();
      },
      { rootMargin: "120px" }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);
  return (
    <video ref={ref} muted loop playsInline preload="none" className={className}>
      {videoSources(src).map((s) => (
        <source key={s} data-src={s} />
      ))}
    </video>
  );
}
