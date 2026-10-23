import { cn } from "@/lib/utils";

/**
 * Fades/lifts content in as it scrolls into view using CSS scroll-driven
 * animations — zero JavaScript, runs on the compositor. Browsers without
 * support (or with reduced motion) simply show the content.
 */
export function Reveal({
  children,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  /** Kept for API compatibility; scroll-driven reveals stagger naturally by position. */
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  return <Tag className={cn("reveal", className)}>{children}</Tag>;
}

/** Thin brand-coloured reading-progress bar, driven by the page's scroll timeline. */
export function ScrollProgress() {
  return (
    <div
      aria-hidden
      className="scroll-progress pointer-events-none fixed inset-x-0 top-0 z-50 h-px origin-left bg-gradient-to-r from-transparent via-brand to-brand"
    />
  );
}
