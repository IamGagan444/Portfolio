"use client";

import createGlobe, { type Arc, type Globe as CobeGlobe, type Marker } from "cobe";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type Location = [lat: number, lng: number];

type GlobeProps = {
  /** Your location: highlighted marker, and the globe starts facing it. */
  home: Location;
  /** Other places to connect with arcs. */
  destinations?: Location[];
  className?: string;
};

const BRAND: [number, number, number] = [0.22, 0.86, 0.66];

/** Converts a location to the cobe rotation that faces it toward the viewer. */
function facing([lat, lng]: Location): [number, number] {
  return [Math.PI - ((lng * Math.PI) / 180 - Math.PI / 2), (lat * Math.PI) / 180];
}

/**
 * Interactive WebGL globe (Magic UI "Globe", built on cobe): slow auto-spin,
 * drag to rotate with inertia, arcs from home to collaborators worldwide.
 * Pauses when off-screen and stays still for reduced-motion users.
 */
export function Globe({ home, destinations = [], className }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<CobeGlobe | null>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== "light";
  const homeKey = home.join(",");
  const destKey = destinations.map((d) => d.join(",")).join("|");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const [homeLat, homeLng] = homeKey.split(",").map(Number) as Location;
    const dests: Location[] = destKey
      ? destKey.split("|").map((d) => d.split(",").map(Number) as Location)
      : [];

    const [phi0, lat0] = facing([homeLat, homeLng]);
    // Tilt so home sits in the visible upper half of the globe.
    const theta0 = lat0 - 0.45;
    let phi = phi0;
    let theta = theta0;
    let velocity = 0;
    let dragging: { x: number; y: number; phi: number; theta: number } | null = null;
    let width = canvas.offsetWidth;
    let raf = 0;
    let visible = true;

    const markers: Marker[] = [
      { location: [homeLat, homeLng], size: 0.045, color: BRAND },
      ...dests.map((location) => ({ location, size: 0.018 })),
    ];
    const arcs: Arc[] = dests.map((to) => ({ from: [homeLat, homeLng], to }));

    const globe = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: width * 2,
      height: width * 2,
      phi,
      theta,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.4 : 1.2,
      mapSamples: 16000,
      mapBrightness: isDark ? 5 : 1.2,
      mapBaseBrightness: 0,
      baseColor: isDark ? [0.16, 0.22, 0.21] : [1, 1, 1],
      markerColor: [0.6, 0.95, 0.85],
      glowColor: isDark ? [0.1, 0.32, 0.26] : [0.85, 0.95, 0.92],
      arcColor: BRAND,
      arcWidth: 0.18,
      arcHeight: 0.16,
      markerElevation: 0.01,
      markers,
      arcs,
      opacity: isDark ? 0.9 : 0.85,
    });
    globeRef.current = globe;

    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (!dragging) {
        if (!reduceMotion) phi += 0.0018 + velocity;
        velocity *= 0.94;
        // Ease the tilt back toward the resting angle after a drag.
        theta += (theta0 - theta) * 0.04;
      }
      globe.update({ phi, theta, width: width * 2, height: width * 2 });
    };
    raf = requestAnimationFrame(loop);

    const onDown = (e: PointerEvent) => {
      dragging = { x: e.clientX, y: e.clientY, phi, theta };
      canvas.setPointerCapture(e.pointerId);
      canvas.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const nextPhi = dragging.phi + (e.clientX - dragging.x) / 220;
      velocity = (nextPhi - phi) * 0.25;
      phi = nextPhi;
      theta = Math.max(-1, Math.min(1, dragging.theta + (e.clientY - dragging.y) / 400));
    };
    const onUp = () => {
      dragging = null;
      canvas.style.cursor = "";
    };
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    const ro = new ResizeObserver(() => {
      width = canvas.offsetWidth;
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
    });
    io.observe(canvas);

    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      globe.destroy();
      globeRef.current = null;
    };
  }, [homeKey, destKey, isDark]);

  return (
    <div className={cn("relative aspect-square", className)}>
      <canvas
        ref={canvasRef}
        data-cursor="grab"
        data-cursor-label="drag to spin"
        aria-label="Interactive globe showing my location"
        role="img"
        className="size-full touch-pan-y opacity-0 transition-opacity duration-1000 [contain:layout_paint_size]"
      />
    </div>
  );
}
