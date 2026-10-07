import { BorderBeam, Reveal } from "@/components/portfolio/effects";
import { Lens } from "@/components/portfolio/lens";
import { HyperText } from "@/components/portfolio/scramble";
import { Container } from "@/components/portfolio/section";
import { projectLinks } from "@/components/portfolio/project-props";
import { getProfile, getProjectBySlug, getPublishedProjects } from "@/lib/data/portfolio";
import { formatPeriod } from "@/lib/format";
import { absoluteUrl, jsonLd } from "@/lib/site";
import { videoSources } from "@/lib/upload-limits";
import { isOptimizableImage } from "@/lib/utils";
import { ArrowLeftIcon, ArrowUpRightIcon } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Markdown from "react-markdown";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };

  const image = project.thumbnail?.url ?? project.images[0]?.url;
  const url = `/projects/${project.slug}`;
  return {
    title: project.title,
    description: project.shortDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.shortDescription,
      url,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description: project.shortDescription,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const [project, profile] = await Promise.all([getProjectBySlug(slug), getProfile()]);
  if (!project) notFound();

  const links = projectLinks(project);
  const period = formatPeriod(project.startDate, project.endDate);
  const gallery = project.images.filter((img) => img.url !== project.thumbnail?.url);
  const hero = project.thumbnail ?? project.images[0] ?? null;

  return (
    <main className="relative pb-24 pt-28 sm:pt-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.shortDescription,
            url: absoluteUrl(`/projects/${project.slug}`),
            image: hero ? absoluteUrl(hero.url) : undefined,
            keywords: project.technologies.join(", "),
            dateCreated: project.startDate || undefined,
            dateModified: project.updatedAt,
            ...(project.githubUrl ? { codeRepository: project.githubUrl } : {}),
            author: profile ? { "@type": "Person", name: profile.name } : undefined,
          }),
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-[30rem] bg-grid mask-radial opacity-60" />
      <Container className="relative max-w-5xl space-y-12">
        <Reveal>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground transition-colors hover:text-brand"
          >
            <ArrowLeftIcon className="size-3.5" /> cd ../projects
          </Link>
        </Reveal>
        <header className="grid gap-8 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {[project.category, period].filter(Boolean).join(" · ")}
            </p>
            <HyperText
              as="h1"
              text={project.title}
              className="block text-[clamp(2.5rem,7vw,5.5rem)] font-semibold leading-[0.95] tracking-[-0.04em]"
            />
            <p className="max-w-2xl text-lg text-muted-foreground text-balance">{project.shortDescription}</p>
          </div>
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-4 py-2 font-mono text-xs backdrop-blur transition-colors hover:border-brand/60 hover:text-brand"
                >
                  {link.icon} {link.type.toLowerCase()} <ArrowUpRightIcon className="size-3" />
                </a>
              ))}
            </div>
          )}
        </header>
        <Reveal delay={0.1}>
          <div className="relative overflow-hidden rounded-2xl border bg-muted">
            <BorderBeam duration={9} />
            {project.video ? (
              <video autoPlay loop muted playsInline className="pointer-events-none w-full object-cover object-top">
                {videoSources(project.video).map((src) => (
                  <source key={src} src={src} />
                ))}
              </video>
            ) : hero ? (
              <Lens zoom={2.2} size={200}>
              <Image
                src={hero.url}
                alt={hero.alt || project.title}
                width={1600}
                height={900}
                priority
                unoptimized={!isOptimizableImage(hero.url)}
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="w-full object-cover object-top"
              />
              </Lens>
            ) : null}
          </div>
        </Reveal>
        <div className="grid gap-10 md:grid-cols-[1fr_16rem]">
          <Reveal>
            {project.description ? (
              <article className="prose max-w-none text-pretty text-muted-foreground dark:prose-invert prose-headings:tracking-tight prose-a:text-brand">
                <Markdown>{project.description}</Markdown>
              </article>
            ) : (
              <p className="text-muted-foreground">{project.shortDescription}</p>
            )}
          </Reveal>
          {project.technologies.length > 0 && (
            <Reveal delay={0.1}>
              <aside className="space-y-3 md:sticky md:top-24">
                <p className="font-mono text-xs uppercase tracking-wider text-brand">./built-with</p>
                <ul className="flex flex-wrap gap-1.5">
                  {project.technologies.map((tech) => (
                    <li key={tech} className="rounded-md border bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {tech}
                    </li>
                  ))}
                </ul>
              </aside>
            </Reveal>
          )}
        </div>
        {gallery.length > 0 && (
          <section className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-wider text-brand">./gallery</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {gallery.map((img, i) => (
                <Reveal key={img.url} delay={(i % 2) * 0.08}>
                  <Lens className="rounded-2xl border" zoom={2} size={150}>
                    <Image
                      src={img.url}
                      alt={img.alt || project.title}
                      width={1000}
                      height={625}
                      loading="lazy"
                      unoptimized={!isOptimizableImage(img.url)}
                      sizes="(max-width: 640px) 100vw, 500px"
                      className="aspect-[16/10] w-full object-cover object-top"
                    />
                  </Lens>
                </Reveal>
              ))}
            </div>
          </section>
        )}
      </Container>
    </main>
  );
}
