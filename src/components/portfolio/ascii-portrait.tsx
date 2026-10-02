"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789$#%&*+=?!@<>{}[]()/\\|;:~^".split("");
const LEVELS = 12; // alpha buckets → one fillStyle change per bucket per frame
const FPS = 30;

type AsciiPortraitProps = {
  /** Image URLs to morph between (same-origin or CORS-enabled, e.g. Cloudinary). */
  images: string[];
  label: string;
  /** Milliseconds each image is held before dissolving into the next. */
  interval?: number;
  className?: string;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Converts an image into a brightness field for a cols×rows character grid.
 * Combines contrast-stretched luminance with edge strength so the silhouette
 * reads clearly, and fades the background with transparency (PNG cut-outs)
 * or a centred vignette.
 */
function sampleImage(img: HTMLImageElement, cols: number, rows: number, cellAspect: number): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = cols;
  canvas.height = rows;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

  // object-fit: cover, biased toward the top (faces), compensating for tall character cells.
  const targetRatio = cols / (rows * cellAspect);
  const imgRatio = img.width / img.height;
  let sw = img.width;
  let sh = img.height;
  if (imgRatio > targetRatio) sw = img.height * targetRatio;
  else sh = img.width / targetRatio;
  const sx = (img.width - sw) / 2;
  const sy = Math.min(img.height - sh, (img.height - sh) * 0.2);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows);

  const { data } = ctx.getImageData(0, 0, cols, rows);
  const n = cols * rows;
  const luma = new Float32Array(n);
  let hasAlpha = false;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    luma[i] = (0.2126 * data[o]! + 0.7152 * data[o + 1]! + 0.0722 * data[o + 2]!) / 255;
    if (data[o + 3]! < 250) hasAlpha = true;
  }

  // Robust contrast stretch (2nd–98th percentile).
  const sorted = Float32Array.from(luma).sort();
  const lo = sorted[Math.floor(n * 0.02)]!;
  const hi = sorted[Math.floor(n * 0.98)]!;
  const range = Math.max(0.05, hi - lo);

  const out = new Float32Array(n);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const l = Math.min(1, Math.max(0, (luma[i]! - lo) / range));

      // Sobel edge magnitude.
      const at = (dx: number, dy: number) => {
        const xx = Math.min(cols - 1, Math.max(0, x + dx));
        const yy = Math.min(rows - 1, Math.max(0, y + dy));
        return luma[yy * cols + xx]!;
      };
      const gx = -at(-1, -1) - 2 * at(-1, 0) - at(-1, 1) + at(1, -1) + 2 * at(1, 0) + at(1, 1);
      const gy = -at(-1, -1) - 2 * at(0, -1) - at(1, -1) + at(-1, 1) + 2 * at(0, 1) + at(1, 1);
      const edge = Math.min(1, Math.hypot(gx, gy) * 2.2);

      let mask: number;
      if (hasAlpha) {
        mask = data[i * 4 + 3]! / 255;
      } else {
        const dx = (x / cols - 0.5) / 0.46;
        const dy = (y / rows - 0.48) / 0.6;
        mask = Math.min(1, Math.max(0, 1.25 - Math.hypot(dx, dy)));
        mask = mask * mask * (3 - 2 * mask); // smoothstep
      }

      // Bright skin/highlights and strong edges carry the likeness; flat areas recede.
      // Cut-outs get a higher floor so the whole figure reads as a dense silhouette.
      const floor = hasAlpha ? 0.34 : 0.1;
      out[i] = mask * Math.min(1, floor + 0.8 * Math.pow(l, 1.35) + 0.7 * edge);
    }
  }
  return out;
}

function hsla(hslTriplet: string, alpha: number) {
  const [h, s, l] = hslTriplet.trim().split(/\s+/);
  return `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

/**
 * Interactive ASCII portrait: renders photos as a field of flickering
 * characters, dissolves between them on a timer, and scrambles/brightens the
 * characters around the pointer.
 */
export function AsciiPortrait({ images, label, interval = 5200, className }: AsciiPortraitProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesKey = images.join("|");

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const sources = imagesKey ? imagesKey.split("|") : [];

    let loaded: HTMLImageElement[] = [];
    let cols = 0;
    let rows = 0;
    let cellW = 0;
    let cellH = 0;
    let fontSize = 11;
    let targets: Float32Array[] = [];
    let current = new Float32Array(0);
    let glyphs = new Uint8Array(0);
    let delays = new Float32Array(0);
    let active = 0;
    let switchedAt = performance.now();
    let raf = 0;
    let last = 0;
    let visible = true;
    let disposed = false;
    const pointer = { x: -1e4, y: -1e4, strength: 0 };
    let colors = { brand: "162 72% 55%", fg: "160 20% 93%" };

    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      colors = {
        brand: style.getPropertyValue("--brand") || colors.brand,
        fg: style.getPropertyValue("--foreground") || colors.fg,
      };
    };

    const scheduleDissolve = () => {
      // Diagonal sweep with jitter, like a wipe made of characters.
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          delays[y * cols + x] = ((x / cols) * 0.6 + (y / rows) * 0.4) * 900 + Math.random() * 500;
        }
      }
      switchedAt = performance.now();
    };

    const layout = () => {
      const rect = wrap.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      fontSize = rect.width < 380 ? 8 : rect.width < 520 ? 9.5 : 11;
      cellW = fontSize * 0.62;
      cellH = fontSize * 1.08;
      cols = Math.max(20, Math.floor(rect.width / cellW));
      rows = Math.max(20, Math.floor(rect.height / cellH));

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Canvas fonts can't use CSS variables; resolve next/font's generated family.
      const mono = getComputedStyle(document.body).getPropertyValue("--font-mono").trim();
      ctx.font = `${fontSize}px ${mono ? `${mono}, ` : ""}ui-monospace, monospace`;
      ctx.textBaseline = "top";

      const n = cols * rows;
      const previous = current;
      current = new Float32Array(n);
      if (previous.length === n) current.set(previous);
      glyphs = new Uint8Array(n).map(() => Math.floor(Math.random() * CHARS.length));
      delays = new Float32Array(n);
      targets = loaded.map((img) => sampleImage(img, cols, rows, cellH / cellW));
      scheduleDissolve();
    };

    const draw = (now: number) => {
      const n = cols * rows;
      const target = targets[active];
      const elapsed = now - switchedAt;
      const buckets: number[][] = Array.from({ length: LEVELS }, () => []);
      const hot: number[] = [];
      const radius = Math.max(cellW, cellH) * 9;

      pointer.strength *= 0.94;

      for (let i = 0; i < n; i++) {
        const t = target ? target[i]! : 0.05;
        if (elapsed > delays[i]!) current[i]! += (t - current[i]!) * 0.14;
        const delta = Math.abs(t - current[i]!);

        let v = current[i]!;
        let churn = 0.012 + delta * 0.9;

        if (pointer.strength > 0.01) {
          const x = (i % cols) * cellW + cellW / 2;
          const y = Math.floor(i / cols) * cellH + cellH / 2;
          const d = Math.hypot(x - pointer.x, y - pointer.y);
          if (d < radius) {
            const k = (1 - d / radius) * pointer.strength;
            v = Math.min(1, v + k * 0.7);
            churn += k * 0.8;
            if (k > 0.45) hot.push(i);
          }
        }

        if (!reduceMotion && Math.random() < churn) glyphs[i] = Math.floor(Math.random() * CHARS.length);
        // Gamma pushes mid-tones down so the figure separates from the noise field.
        const level = Math.min(LEVELS - 1, Math.floor((0.05 + Math.pow(v, 1.6) * 0.95) * LEVELS));
        buckets[level]!.push(i);
      }

      ctx.clearRect(0, 0, cols * cellW + cellW, rows * cellH + cellH);
      for (let level = 0; level < LEVELS; level++) {
        const indices = buckets[level]!;
        if (indices.length === 0) continue;
        const alpha = (level + 1) / LEVELS;
        // Brightest cells take the foreground colour; the rest glow in the brand colour.
        ctx.fillStyle = level >= LEVELS - 2 ? hsla(colors.fg, 0.95) : hsla(colors.brand, alpha * 0.9);
        for (const i of indices) {
          ctx.fillText(CHARS[glyphs[i]!]!, (i % cols) * cellW, Math.floor(i / cols) * cellH);
        }
      }
      if (hot.length) {
        ctx.fillStyle = hsla(colors.fg, 1);
        for (const i of hot) ctx.fillText(CHARS[glyphs[i]!]!, (i % cols) * cellW, Math.floor(i / cols) * cellH);
      }

      if (targets.length > 1 && now - switchedAt > interval) {
        active = (active + 1) % targets.length;
        scheduleDissolve();
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < 1000 / FPS) return;
      last = now;
      draw(now);
    };

    const onPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.strength = 1;
    };

    readColors();
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "style"] });

    const resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(wrap);

    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting) && document.visibilityState === "visible";
    });
    io.observe(wrap);
    const onVisibility = () => {
      visible = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibility);
    wrap.addEventListener("pointermove", onPointer);

    Promise.allSettled(sources.map(loadImage)).then((results) => {
      if (disposed) return;
      loaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      layout();
      if (reduceMotion) {
        // Static render: settle on the first image and stop.
        current.set(targets[0] ?? current);
        draw(performance.now());
        return;
      }
      raf = requestAnimationFrame(loop);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      wrap.removeEventListener("pointermove", onPointer);
    };
  }, [imagesKey, interval]);

  return (
    <div ref={wrapRef} className={cn("relative select-none", className)} role="img" aria-label={label}>
      <canvas ref={canvasRef} className="absolute inset-0" aria-hidden />
    </div>
  );
}
