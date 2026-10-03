import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";

import { formatPeriod } from "@/lib/format";
import { cn, isOptimizableImage } from "@/lib/utils";
import type { ProjectDTO } from "@/lib/validations/portfolio";

import { BorderBeam, LazyVideo, MagicCard, Reveal } from "./effects";
import { projectLinks } from "./project-props";

/** Project card with spotlight, lazy video preview, and links. */
export function ProjectTile({ project, index, wide }: { project: ProjectDTO; index: number; wide: boolean }) {
  const links = projectLinks(project);
  const media = project.thumbnail?.url;
  return (
    <Reveal delay={(index % 3) * 0.08} className={cn(wide && "md:col-span-2")}>
      <MagicCard className="flex h-full flex-col">
        {index === 0 && <BorderBeam />}
        <Link
          href={`/projects/${project.slug}`}
          className="relative block overflow-hidden border-b bg-muted"
          aria-label={project.title}
          data-cursor="view"
          data-cursor-label="View project"
        >
          <div className={cn("relative w-full", wide ? "aspect-[16/8]" : "aspect-[16/10]")}>
            {project.video ? (
              <LazyVideo src={project.video} className="absolute inset-0 size-full object-cover object-top transition-transform duration-700 group-hover/magic:scale-[1.03]" />
            ) : media ? (
              <Image
                src={media}
                alt={project.thumbnail?.alt || project.title}
                fill
                sizes={wide ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                unoptimized={!isOptimizableImage(media)}
                className="object-cover object-top transition-transform duration-700 group-hover/magic:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-grid font-mono text-4xl text-brand/60">
                {project.title.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
            <span className="absolute left-4 top-4 rounded-full border bg-background/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider backdrop-blur">
              {String(index + 1).padStart(2, "0")} {project.category && `· ${project.category}`}
            </span>
          </div>
        </Link>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Link href={`/projects/${project.slug}`} className="text-xl font-semibold tracking-tight hover:text-brand">
                {project.title}
              </Link>
              <p className="font-mono text-xs text-muted-foreground">{formatPeriod(project.startDate, project.endDate)}</p>
            </div>
            <Link
              href={`/projects/${project.slug}`}
              aria-label={`Open ${project.title}`}
              className="rounded-full border p-2 text-muted-foreground transition-all group-hover/magic:-rotate-45 group-hover/magic:border-brand/60 group-hover/magic:text-brand"
            >
              <ArrowRightIcon className="size-4" />
            </Link>
          </div>
          <div className="prose prose-sm max-w-none text-pretty text-muted-foreground dark:prose-invert">
            <Markdown>{project.shortDescription}</Markdown>
          </div>
          <div className="mt-auto space-y-4">
            {project.technologies.length > 0 && (
              <ul className="flex flex-wrap gap-1.5">
                {project.technologies.slice(0, wide ? 10 : 6).map((t) => (
                  <li key={t} className="rounded-md border bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {t}
                  </li>
                ))}
              </ul>
            )}
            {links.length > 0 && (
              <div className="flex gap-4 border-t pt-4">
                {links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-brand"
                  >
                    {l.icon} {l.type.toLowerCase()} <ArrowUpRightIcon className="size-3" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </MagicCard>
    </Reveal>
  );
}
