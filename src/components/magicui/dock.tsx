"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import React, { useRef } from "react";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  magnification?: number;
  distance?: number;
  children: React.ReactNode;
}

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva("mx-auto w-max h-full p-2 flex items-end rounded-full border");

/**
 * Magic UI dock with mouse-proximity magnification, implemented without an
 * animation library: one rAF-batched pass sets icon widths, CSS eases them.
 * Touch devices get a static dock (no work at all).
 */
const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  ({ className, children, magnification = DEFAULT_MAGNIFICATION, distance = DEFAULT_DISTANCE, ...props }, ref) => {
    const innerRef = useRef<HTMLDivElement | null>(null);
    const frame = useRef(0);

    const setRefs = (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const magnify = (pageX: number | null) => {
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const icons = innerRef.current?.querySelectorAll<HTMLElement>("[data-dock-icon]") ?? [];
        for (const icon of icons) {
          if (pageX === null) {
            icon.style.width = `${DEFAULT_SIZE}px`;
            continue;
          }
          const rect = icon.getBoundingClientRect();
          const center = rect.left + window.scrollX + rect.width / 2;
          const d = Math.min(distance, Math.abs(pageX - center));
          const size = DEFAULT_SIZE + (magnification - DEFAULT_SIZE) * Math.cos((d / distance) * (Math.PI / 2));
          icon.style.width = `${size}px`;
        }
      });
    };

    return (
      <div
        ref={setRefs}
        onPointerMove={(e) => e.pointerType === "mouse" && magnify(e.pageX)}
        onPointerLeave={() => magnify(null)}
        {...props}
        className={cn(dockVariants({ className }))}
      >
        {children}
      </div>
    );
  },
);

Dock.displayName = "Dock";

export interface DockIconProps {
  className?: string;
  children?: React.ReactNode;
}

const DockIcon = ({ className, children }: DockIconProps) => (
  <div
    data-dock-icon
    style={{ width: DEFAULT_SIZE }}
    className={cn(
      "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-[width] duration-150 ease-out",
      className,
    )}
  >
    {children}
  </div>
);

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon, dockVariants };
