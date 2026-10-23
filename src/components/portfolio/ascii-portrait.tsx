"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { isLowPowerDevice, whenIdle } from "./use-device";

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
    const lowPower = isLowPowerDevice();
    const fps = lowPower ? 20 : FPS;
    let cols = 0;
    let rows = 0;
    let cellW = 0;
    let cellH = 0;
    let fontSize = 11;
    let dpr = 1;
    let targets: (Float32Array | null)[] = [];
    let cancelSampling = () => {};
    let current = new Float32Array(0);
    let glyphs = new Uint8Array(0);
    let delays = new Float32Array(0);
    // What each cell currently shows, so only changed cells are repainted.
    let shownGlyph = new Uint8Array(0);
    let shownLevel = new Uint8Array(0);
    let cellX = new Int32Array(0); // device-pixel cell edges (integer grid → no seams)
    let cellY = new Int32Array(0);
    let atlas: HTMLCanvasElement | null = null;
    let atlasW = 0;
    let atlasH = 0;
    let active = 0;
    let switchedAt = performance.now();
    let raf = 0;
    let last = 0;
    let visible = true;
    let disposed = false;
    const pointer = { x: -1e4, y: -1e4, strength: 0 };
    let colors = { brand: "162 72% 55%", fg: "160 20% 93%" };
    const HOT = LEVELS; // extra atlas row: full-brightness highlight

    /** Pre-renders every glyph at every brightness level once; frames then just copy pixels. */
    const buildAtlas = () => {
      if (!cols) return;
      atlasW = Math.ceil(cellW * dpr);
      atlasH = Math.ceil(cellH * dpr);
      atlas = document.createElement("canvas");
      atlas.width = atlasW * CHARS.length;
      atlas.height = atlasH * (LEVELS + 1);
      const a = atlas.getContext("2d")!;
      const mono = getComputedStyle(document.body).getPropertyValue("--font-mono").trim();
      a.font = `${fontSize * dpr}px ${mono ? `${mono}, ` : ""}ui-monospace, monospace`;
      a.textBaseline = "top";
      for (let level = 0; level <= LEVELS; level++) {
        a.fillStyle =
          level === HOT
            ? hsla(colors.fg, 1)
            : level >= LEVELS - 2
              ? hsla(colors.fg, 0.95)
              : hsla(colors.brand, ((level + 1) / LEVELS) * 0.9);
        for (let c = 0; c < CHARS.length; c++) a.fillText(CHARS[c]!, c * atlasW, level * atlasH);
      }
      shownLevel.fill(255); // force a full repaint with the new atlas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const readColors = () => {
      const style = getComputedStyle(document.documentElement);
      colors = {
        brand: style.getPropertyValue("--brand") || colors.brand,
        fg: style.getPropertyValue("--foreground") || colors.fg,
      };
      buildAtlas();
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
      dpr = Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2);
      // Bigger cells on small/low-power screens: fewer glyphs, same look.
      fontSize = lowPower ? (rect.width < 380 ? 9.5 : 10.5) : rect.width < 520 ? 9.5 : 11;
      cellW = fontSize * 0.62;
      cellH = fontSize * 1.08;
      cols = Math.max(20, Math.floor(rect.width / cellW));
      rows = Math.max(20, Math.floor(rect.height / cellH));

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      cellX = new Int32Array(cols + 1).map((_, i) => Math.round(i * cellW * dpr));
      cellY = new Int32Array(rows + 1).map((_, i) => Math.round(i * cellH * dpr));

      const n = cols * rows;
      const previous = current;
      current = new Float32Array(n);
      if (previous.length === n) current.set(previous);
      glyphs = new Uint8Array(n).map(() => Math.floor(Math.random() * CHARS.length));
      shownGlyph = new Uint8Array(n);
      shownLevel = new Uint8Array(n).fill(255);
      delays = new Float32Array(n);
      // Convert the first photo now; the rest in idle slices so no single task is long.
      cancelSampling();
      targets = loaded.map((img, i) => (i === 0 ? sampleImage(img, cols, rows, cellH / cellW) : null));
      const sampleNext = (i: number) => {
        if (i >= loaded.length) return;
        cancelSampling = whenIdle(() => {
          targets[i] = sampleImage(loaded[i]!, cols, rows, cellH / cellW);
          sampleNext(i + 1);
        });
      };
      sampleNext(1);
      buildAtlas();
      scheduleDissolve();
    };

    const draw = (now: number) => {
      if (!atlas) return;
      const n = cols * rows;
      const target = targets[active];
      const elapsed = now - switchedAt;
      const radius = Math.max(cellW, cellH) * 9;
      const pointerActive = pointer.strength > 0.01;
      pointer.strength *= 0.94;

      for (let i = 0; i < n; i++) {
        const t = target ? target[i]! : 0.05;
        if (elapsed > delays[i]!) current[i]! += (t - current[i]!) * 0.14;
        let v = current[i]!;
        let churn = 0.012 + Math.abs(t - v) * 0.9;
        let hot = false;

        if (pointerActive) {
          const col = i % cols;
          const row = (i - col) / cols;
          const d = Math.hypot((col + 0.5) * cellW - pointer.x, (row + 0.5) * cellH - pointer.y);
          if (d < radius) {
            const k = (1 - d / radius) * pointer.strength;
            v = Math.min(1, v + k * 0.7);
            churn += k * 0.8;
            hot = k > 0.45;
          }
        }

        if (!reduceMotion && Math.random() < churn) glyphs[i] = Math.floor(Math.random() * CHARS.length);
        // Gamma pushes mid-tones down so the figure separates from the noise field.
        const level = hot ? HOT : Math.min(LEVELS - 1, Math.floor((0.05 + Math.pow(v, 1.6) * 0.95) * LEVELS));
        const glyph = glyphs[i]!;
        if (level === shownLevel[i] && glyph === shownGlyph[i]) continue;

        // Repaint just this cell.
        const col = i % cols;
        const row = (i - col) / cols;
        const x = cellX[col]!;
        const y = cellY[row]!;
        ctx.clearRect(x, y, cellX[col + 1]! - x, cellY[row + 1]! - y);
        ctx.drawImage(atlas, glyph * atlasW, level * atlasH, atlasW, atlasH, x, y, atlasW, atlasH);
        shownLevel[i] = level;
        shownGlyph[i] = glyph;
      }

      if (targets.length > 1 && now - switchedAt > interval) {
        const next = (active + 1) % targets.length;
        // Only advance once the next photo has been converted.
        if (targets[next]) {
          active = next;
          scheduleDissolve();
        }
      }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || now - last < 1000 / fps) return;
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

    let cancelIdle = () => {};
    const start = () => Promise.allSettled(sources.map(loadImage)).then((results) => {
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
    // Heavy setup waits for an idle moment so first paint and taps stay snappy.
    cancelIdle = whenIdle(() => void start());

    return () => {
      disposed = true;
      cancelIdle();
      cancelSampling();
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
