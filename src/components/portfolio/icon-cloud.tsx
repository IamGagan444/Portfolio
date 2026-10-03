"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export type CloudIcon = {
  name: string;
  /** Explicit image URL (from the CMS); takes precedence over slugs. */
  url?: string;
  /** Simple Icons slugs to try in order; falls back to a text badge. */
  slugs: string[];
};

// Brands whose official colour is black/near-black: recoloured on dark themes.
const DARK_BRANDS = new Set([
  "nextdotjs", "express", "socketdotio", "jsonwebtokens", "shadcnui", "github", "vercel",
  "prisma", "threedotjs", "openai", "x", "notion", "githubactions", "markdown", "authjs", "bun",
]);

function sourcesFor(icon: CloudIcon, dark: boolean): string[] {
  if (icon.url) return [icon.url];
  return icon.slugs.map((slug) =>
    dark && DARK_BRANDS.has(slug) ? `https://cdn.simpleicons.org/${slug}/e6f0ee` : `https://cdn.simpleicons.org/${slug}`,
  );
}

type Item = {
  name: string;
  img: HTMLImageElement | null;
  x: number;
  y: number;
  z: number;
};

function loadFirst(sources: string[]): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const tryAt = (i: number) => {
      if (i >= sources.length) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => tryAt(i + 1);
      img.src = sources[i]!;
    };
    tryAt(0);
  });
}

/**
 * 3D rotating sphere of skill icons (Magic UI "Icon Cloud"), drawn on canvas.
 * Drag to spin; hovering an icon names it; it keeps drifting when idle.
 */
export function IconCloud({ icons, className }: { icons: CloudIcon[]; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { resolvedTheme } = useTheme();
  const key = icons.map((i) => i.name).join("|");

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const label = labelRef.current;
    if (!wrap || !canvas || !label) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const styles = getComputedStyle(document.documentElement);
    const fg = `hsl(${styles.getPropertyValue("--foreground")})`;
    const card = `hsl(${styles.getPropertyValue("--card")})`;
    const border = `hsl(${styles.getPropertyValue("--border")})`;
    const brand = `hsl(${styles.getPropertyValue("--brand")})`;

    // Fibonacci sphere distributes icons evenly.
    const n = icons.length;
    const items: Item[] = icons.map((icon, i) => {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = Math.PI * (3 - Math.sqrt(5)) * i;
      return { name: icon.name, img: null, x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });
    const dark = resolvedTheme !== "light";
    icons.forEach((icon, i) => {
      void loadFirst(sourcesFor(icon, dark)).then((img) => {
        items[i]!.img = img;
      });
    });

    let size = wrap.clientWidth;
    let rotX = 0.4;
    let rotY = 0;
    let velX = 0;
    let velY = reduceMotion ? 0 : 0.004;
    let drag: { x: number; y: number } | null = null;
    let pointer: { x: number; y: number } | null = null;
    let raf = 0;
    let visible = true;

    const resize = () => {
      size = wrap.clientWidth;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      if (!drag) {
        rotY += velY;
        rotX += velX;
        velX *= 0.95;
        velY += ((reduceMotion ? 0 : 0.004) - velY) * 0.02;
      }
      ctx.clearRect(0, 0, size, size);
      const radius = size * 0.38;
      const cx = size / 2;
      const cy = size / 2;
      const iconSize = Math.max(26, size * 0.085);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);

      const projected = items
        .map((item) => {
          const x1 = item.x * cosY + item.z * sinY;
          const z1 = -item.x * sinY + item.z * cosY;
          const y1 = item.y * cosX - z1 * sinX;
          const z2 = item.y * sinX + z1 * cosX;
          const scale = (z2 + 2) / 3; // 0.33 (back) … 1 (front)
          return { item, sx: cx + x1 * radius, sy: cy + y1 * radius, scale, depth: z2 };
        })
        .sort((a, b) => a.depth - b.depth);

      let hovered: (typeof projected)[number] | null = null;
      for (const p of projected) {
        const s = iconSize * p.scale;
        ctx.globalAlpha = Math.max(0.12, (p.depth + 1) / 2);
        if (pointer && p.depth > 0 && Math.hypot(pointer.x - p.sx, pointer.y - p.sy) < s * 0.7) hovered = p;
        // Tile behind each icon keeps dark logos legible on dark themes.
        ctx.fillStyle = card;
        ctx.strokeStyle = hovered === p ? brand : border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(p.sx - s * 0.7, p.sy - s * 0.7, s * 1.4, s * 1.4, s * 0.35);
        ctx.fill();
        ctx.stroke();
        if (p.item.img) {
          ctx.drawImage(p.item.img, p.sx - s / 2, p.sy - s / 2, s, s);
        } else {
          ctx.fillStyle = fg;
          ctx.font = `600 ${Math.round(s * 0.42)}px ui-monospace, monospace`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.item.name.slice(0, 2).toUpperCase(), p.sx, p.sy);
        }
      }
      ctx.globalAlpha = 1;

      if (hovered) {
        label.textContent = hovered.item.name;
        label.style.opacity = "1";
        label.style.transform = `translate(${hovered.sx}px, ${hovered.sy - iconSize * hovered.scale - 14}px) translate(-50%, -100%)`;
      } else {
        label.style.opacity = "0";
      }
    };
    raf = requestAnimationFrame(draw);

    const onDown = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      rotY += dx * 0.008;
      rotX += dy * 0.008;
      velY = dx * 0.0015;
      velX = dy * 0.0015;
      drag = { x: e.clientX, y: e.clientY };
    };
    const onUp = () => {
      drag = null;
    };
    const onLeave = () => {
      pointer = null;
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("pointerleave", onLeave);
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    io.observe(wrap);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
    // icons are captured via `key`; theme change re-reads colours.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, resolvedTheme]);

  return (
    <div ref={wrapRef} className={cn("relative aspect-square w-full", className)}>
      <canvas
        ref={canvasRef}
        data-cursor="grab"
        data-cursor-label="drag to spin"
        role="img"
        aria-label={`Skills: ${icons.map((i) => i.name).join(", ")}`}
        className="absolute inset-0 touch-pan-y"
      />
      <span
        ref={labelRef}
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 whitespace-nowrap rounded-md border bg-background/90 px-2 py-1 font-mono text-[11px] opacity-0 shadow-sm backdrop-blur transition-opacity"
      />
    </div>
  );
}
