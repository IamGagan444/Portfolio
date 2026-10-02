import { cn } from "@/lib/utils";

import { Reveal } from "./effects";
import { HyperText } from "./scramble";

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-6xl px-5 sm:px-8", className)}>{children}</div>;
}

/** Numbered section header: `02 / about` eyebrow + scrambling title. */
export function SectionHeading({
  index,
  label,
  title,
  description,
  className,
}: {
  index: string;
  label: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <Reveal className={cn("mb-12 flex flex-col gap-4 sm:mb-16 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="text-brand">{index}</span> / {label}
        </p>
        <HyperText
          as="h2"
          text={title}
          className="block text-4xl font-semibold tracking-[-0.03em] text-balance sm:text-5xl md:text-6xl"
        />
      </div>
      {description && <p className="max-w-sm text-sm text-muted-foreground md:text-right">{description}</p>}
    </Reveal>
  );
}
