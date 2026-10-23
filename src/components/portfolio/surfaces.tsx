import { cn } from "@/lib/utils";

/*
 * Magic UI surfaces rendered entirely on the server (no hydration cost).
 */

/** Card with a pointer-following spotlight and glowing border (Magic UI "Magic Card"). */
export function MagicCard({ children, className }: { children: React.ReactNode; className?: string }) {
  // Server-rendered; the pointer position comes from one shared <SpotlightTracker />.
  return (
    <div
      data-spotlight
      className={cn(
        "group/magic relative overflow-hidden rounded-2xl border bg-card/70 transition-colors",
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
  repeat = 4,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  /** Copies of the content; enough to cover wide screens with no gap. */
  repeat?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("group flex overflow-hidden mask-fade-x [--gap:0.75rem] [gap:var(--gap)]", className)}
      style={{ "--duration": `${duration}s` } as React.CSSProperties}
    >
      {Array.from({ length: repeat }, (_, copy) => (
        <div
          key={copy}
          aria-hidden={copy > 0}
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

