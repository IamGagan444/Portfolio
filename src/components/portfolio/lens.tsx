"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

type LensProps = {
  children: React.ReactNode;
  zoom?: number;
  size?: number;
  className?: string;
};

/**
 * Magnifying lens (Magic UI "Lens"): a circular region under the pointer
 * shows a zoomed copy of the content. Keyboard/touch users simply see the
 * content as-is.
 */
export function Lens({ children, zoom = 2, size = 180, className }: LensProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={ref}
      data-cursor="crosshair"
      data-cursor-label={`${zoom}× lens`}
      className={cn("relative overflow-hidden", className)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const rect = ref.current!.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }}
      onPointerLeave={() => setPos(null)}
    >
      {children}
      <AnimatePresence>
        {pos && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              maskImage: `radial-gradient(circle ${size / 2}px at ${pos.x}px ${pos.y}px, black 98%, transparent 100%)`,
              WebkitMaskImage: `radial-gradient(circle ${size / 2}px at ${pos.x}px ${pos.y}px, black 98%, transparent 100%)`,
              transformOrigin: `${pos.x}px ${pos.y}px`,
            }}
          >
            <div
              className="absolute inset-0"
              style={{ transform: `scale(${zoom})`, transformOrigin: `${pos.x}px ${pos.y}px` }}
            >
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {pos && (
        <span
          aria-hidden
          className="pointer-events-none absolute z-20 rounded-full border border-brand/70 shadow-[0_0_0_1px_hsl(var(--background)/0.6),0_10px_30px_-10px_hsl(var(--brand)/0.6)]"
          style={{ width: size, height: size, left: pos.x - size / 2, top: pos.y - size / 2 }}
        />
      )}
    </div>
  );
}
