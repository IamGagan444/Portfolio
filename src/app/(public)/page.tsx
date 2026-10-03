import { AsciiPortrait } from "@/components/portfolio/ascii-portrait";
import { DottedMap } from "@/components/portfolio/dotted-map";
import {
  CopyEmail,
  LocalTime,
  MagicCard,
  Marquee,
  NumberTicker,
  Reveal,
} from "@/components/portfolio/effects";
import { Globe } from "@/components/portfolio/globe";
import { IconCloud } from "@/components/portfolio/icon-cloud";
import { ProjectTile } from "@/components/portfolio/project-tile";
import { HyperText, RoleRotator } from "@/components/portfolio/scramble";
import { Container, SectionHeading } from "@/components/portfolio/section";
import { Terminal } from "@/components/portfolio/terminal";
import { SocialIcon } from "@/components/social-icon";
import {
  getActiveResume,
  getCertifications,
  getEducation,
  getExperience,
  getHackathons,
  getProfile,
  getPublishedProjects,
  getSkills,
} from "@/lib/data/portfolio";
import { formatEventRange, formatMonthYear, formatPeriod } from "@/lib/format";
import { jsonLd, SITE_URL } from "@/lib/site";
import { skillIcon } from "@/lib/skill-icons";
import { cn, isOptimizableImage } from "@/lib/utils";
import type { ExperienceDTO, SkillDTO } from "@/lib/validations/portfolio";
import { SKILL_CATEGORIES } from "@/lib/validations/portfolio";
import { ArrowDownIcon, ArrowRightIcon, ArrowUpRightIcon, DownloadIcon, MapPinIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Markdown from "react-markdown";

// Collaboration hubs drawn as arcs from home on the globe and map.
const HUBS = [
  { name: "San Francisco", lat: 37.77, lng: -122.42 },
  { name: "New York", lat: 40.71, lng: -74.0 },
  { name: "London", lat: 51.51, lng: -0.13 },
  { name: "Berlin", lat: 52.52, lng: 13.4 },
  { name: "Dubai", lat: 25.2, lng: 55.27 },
  { name: "Singapore", lat: 1.35, lng: 103.82 },
  { name: "Tokyo", lat: 35.68, lng: 139.65 },
  { name: "Sydney", lat: -33.87, lng: 151.21 },
];

function monthsOfExperience(items: ExperienceDTO[]) {
  const now = Date.now();
  return items.reduce((total, e) => {
    const start = new Date(e.startDate).getTime();
    const end = e.currentlyWorking || !e.endDate ? now : new Date(e.endDate).getTime();
    return total + Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44)));
  }, 0);
}

function groupSkills(skills: SkillDTO[]) {
  return SKILL_CATEGORIES.map((category) => ({
    category,
    items: skills.filter((s) => s.category === category),
  })).filter((group) => group.items.length > 0);
}

export default async function Page() {
  const [profile, projects, experience, education, skills, certifications, hackathons, resume] =
    await Promise.all([
      getProfile(),
      getPublishedProjects(),
      getExperience(),
      getEducation(),
      getSkills(),
      getCertifications(),
      getHackathons(),
      getActiveResume(),
    ]);

  if (!profile) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-2 px-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio coming soon</h1>
        <p className="text-sm text-muted-foreground">Content hasn&apos;t been published yet.</p>
      </main>
    );
  }

  const firstName = profile.name.split(" ")[0] ?? profile.name;
  const heroImages = (profile.heroImages.length ? profile.heroImages : profile.profileImage ? [profile.profileImage] : []).map(
    (m) => m.url,
  );
  const featured = projects.filter((p) => p.featured);
  const shownProjects = (featured.length > 0 ? featured : projects).slice(0, 6);
  const email = profile.email || profile.socialLinks.find((l) => l.platform === "email")?.url.replace(/^mailto:/, "");
  const months = monthsOfExperience(experience);
  const stats = [
    months >= 24
      ? { value: Math.floor(months / 12), suffix: "+", label: "years shipping" }
      : { value: months, suffix: "", label: "months in production" },
    { value: projects.length, suffix: "", label: "projects built" },
    { value: skills.length, suffix: "", label: "tools in the stack" },
    { value: hackathons.length, suffix: "", label: hackathons.length === 1 ? "hackathon" : "hackathons" },
  ];
  const skillGroups = groupSkills(skills);
  const home =
    profile.latitude !== null && profile.longitude !== null
      ? { name: profile.location || "Home", lat: profile.latitude, lng: profile.longitude }
      : null;
  const half = Math.ceil(skills.length / 2);

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            url: SITE_URL,
            description: profile.headline,
            jobTitle: profile.roles[0],
            image: profile.profileImage?.url,
            email: profile.email || undefined,
            address: profile.location || undefined,
            sameAs: profile.socialLinks.filter((l) => l.url.startsWith("http")).map((l) => l.url),
          }),
        }}
      />

      {/* ─── 01 · Hero ─────────────────────────────────────────────── */}
      <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-20">
        <div aria-hidden className="absolute inset-0 bg-grid mask-radial opacity-70" />
        <div
          aria-hidden
          className="absolute -left-40 -top-40 size-[36rem] rounded-full bg-brand/10 blur-[120px] dark:bg-brand/[0.08]"
        />
        {home && (
          // The globe rises from the bottom of the hero; drag it to spin.
          <div className="absolute left-1/2 top-[62%] w-[min(1150px,170vw)] -translate-x-1/2 sm:top-[60%]">
            <Globe
              home={[home.lat, home.lng]}
              destinations={HUBS.map((h) => [h.lat, h.lng])}
              className="opacity-60 dark:opacity-75"
            />
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent" />
        {/* The layout layer ignores the pointer so the globe stays draggable; its content opts back in. */}
        <Container className="pointer-events-none relative grid items-center gap-10 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-6">
          <div className="pointer-events-auto space-y-8">
            <Reveal>
              <p className="inline-flex flex-wrap items-center gap-2 rounded-full border bg-background/60 px-3 py-1.5 font-mono text-xs text-muted-foreground backdrop-blur">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60" />
                  <span className="relative inline-flex size-2 rounded-full bg-brand" />
                </span>
                {profile.availability || "Building on the web"}
                {profile.location && (
                  <>
                    <span className="text-border">|</span>
                    <MapPinIcon className="size-3" /> {profile.location}
                  </>
                )}
              </p>
            </Reveal>

            <div className="space-y-4">
              <h1 className="text-[clamp(3.2rem,10vw,8rem)] font-semibold leading-[0.85] tracking-[-0.05em]">
                <span className="block font-serif text-[0.55em] font-normal italic tracking-normal text-muted-foreground">
                  Hi, I&apos;m
                </span>
                <HyperText text={firstName} duration={1100} className="block" />
              </h1>
              {profile.roles.length > 0 && (
                <p className="font-mono text-base text-brand sm:text-lg">
                  <span className="text-muted-foreground">&gt; </span>
                  <RoleRotator roles={profile.roles} />
                </p>
              )}
            </div>

            <Reveal delay={0.15}>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground text-balance">{profile.headline}</p>
            </Reveal>

            <Reveal delay={0.25} className="flex flex-wrap items-center gap-3">
              <Link
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
              >
                See my work
                <ArrowDownIcon className="size-4 transition-transform group-hover:translate-y-0.5" />
              </Link>
              {resume && (
                <a
                  href="/resume"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:border-brand/60 hover:text-brand"
                >
                  <DownloadIcon className="size-4" /> Resume
                </a>
              )}
              <div className="flex items-center gap-1 pl-1">
                {profile.socialLinks
                  .filter((l) => l.showInNav)
                  .map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target={link.url.startsWith("http") ? "_blank" : undefined}
                      rel={link.url.startsWith("http") ? "noopener noreferrer" : undefined}
                      aria-label={link.label}
                      className="rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <SocialIcon platform={link.platform} className="size-4" />
                    </a>
                  ))}
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="pointer-events-auto relative mx-auto w-full max-w-[460px]">
            <div className="relative aspect-[4/5] w-full" data-cursor="crosshair" data-cursor-label="scramble me">
              {/* Corner brackets frame the portrait like a viewfinder. */}
              {["left-0 top-0 border-l border-t", "right-0 top-0 border-r border-t", "bottom-0 left-0 border-b border-l", "bottom-0 right-0 border-b border-r"].map(
                (pos) => (
                  <span key={pos} aria-hidden className={cn("absolute size-5 border-brand/70", pos)} />
                ),
              )}
              <AsciiPortrait images={heroImages} label={`Portrait of ${profile.name} rendered in ASCII characters`} className="absolute inset-3" />
            </div>
            <div className="mt-3 flex items-center justify-between font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <span>fig.01 — {firstName.toLowerCase()}.ascii</span>
              <span className="hidden sm:inline">↖ move your cursor</span>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ─── Skills marquee ───────────────────────────────────────── */}
      {skills.length > 0 && (
        <section aria-label="Skills" className="space-y-3 border-y bg-card/30 py-6">
          <Marquee duration={45}>
            {skills.slice(0, half).map((s) => (
              <span key={s.id} className="flex items-center gap-3 whitespace-nowrap font-mono text-sm text-muted-foreground">
                <span className="text-brand">✦</span> {s.name}
              </span>
            ))}
          </Marquee>
          <Marquee duration={45} reverse>
            {skills.slice(half).map((s) => (
              <span key={s.id} className="flex items-center gap-3 whitespace-nowrap font-mono text-sm text-muted-foreground">
                <span className="text-brand">✦</span> {s.name}
              </span>
            ))}
          </Marquee>
        </section>
      )}

      {/* ─── 02 · About ───────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-20 py-24 sm:py-32">
        <Container>
          <SectionHeading index="01" label="about" title="The person behind the prompt." />
          <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
            <Reveal>
              <Terminal
                title={`${firstName.toLowerCase()}@portfolio: ~`}
                lines={[
                  {
                    command: "whoami",
                    output: (
                      <p>
                        <span className="text-foreground">{profile.name}</span>
                        {profile.roles[0] && <> — {profile.roles[0]}</>}
                      </p>
                    ),
                  },
                  {
                    command: "cat about.md",
                    output: (
                      <div className="prose prose-sm max-w-none text-pretty text-muted-foreground dark:prose-invert">
                        <Markdown>{profile.bio || profile.headline}</Markdown>
                      </div>
                    ),
                  },
                  ...(skillGroups.length
                    ? [
                        {
                          command: "ls ./stack",
                          output: (
                            <div className="grid gap-1 font-mono text-xs sm:grid-cols-2">
                              {skillGroups.map((g) => (
                                <p key={g.category}>
                                  <span className="text-brand">{g.category.toLowerCase()}/</span>{" "}
                                  {g.items.map((s) => s.name).join("  ")}
                                </p>
                              ))}
                            </div>
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            </Reveal>
            <div className="grid grid-cols-2 gap-4 self-start">
              {stats.map((stat, i) => (
                <Reveal key={stat.label} delay={i * 0.08}>
                  <MagicCard className="p-5 sm:p-6">
                    <p className="text-4xl font-semibold tracking-tight sm:text-5xl">
                      <NumberTicker value={stat.value} suffix={stat.suffix} />
                    </p>
                    <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </p>
                  </MagicCard>
                </Reveal>
              ))}
              {email && (
                <Reveal delay={0.35} className="col-span-2">
                  <MagicCard className="flex items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Inbox open</p>
                      <a href={`mailto:${email}`} className="mt-1 block break-all text-sm hover:text-brand">
                        {email}
                      </a>
                    </div>
                    <ArrowUpRightIcon className="size-5 shrink-0 text-brand" />
                  </MagicCard>
                </Reveal>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─── 03 · Experience ──────────────────────────────────────── */}
      {experience.length > 0 && (
        <section id="work" className="scroll-mt-20 py-24 sm:py-32">
          <Container>
            <SectionHeading
              index="02"
              label="experience"
              title="Where I've shipped."
              description="Roles, teams and the things I built along the way."
            />
            <ol className="relative space-y-6 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-gradient-to-b before:from-brand/70 before:via-border before:to-transparent md:before:left-[calc(12rem+7px)]">
              {experience.map((job, i) => (
                <Reveal as="li" key={job.id} delay={i * 0.06} className="relative grid gap-3 pl-8 md:grid-cols-[12rem_1fr] md:gap-10 md:pl-0">
                    <span
                      aria-hidden
                      className="absolute left-0 top-6 size-[15px] rounded-full border-2 border-background bg-brand shadow-[0_0_0_4px_hsl(var(--brand)/0.15)] md:left-48"
                    />
                    <div className="pt-5 font-mono text-xs text-muted-foreground md:text-right">
                      <p>{formatPeriod(job.startDate, job.endDate, { current: job.currentlyWorking })}</p>
                      <p className="mt-1">{[job.employmentType, job.location].filter(Boolean).join(" · ")}</p>
                    </div>
                    <MagicCard className="md:ml-8">
                      <div className="space-y-4 p-6">
                        <div className="flex items-start gap-4">
                          {job.logo?.url && (
                            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-1.5">
                              <Image
                                src={job.logo.url}
                                alt={job.company}
                                width={44}
                                height={44}
                                unoptimized={!isOptimizableImage(job.logo.url)}
                                className="size-full object-contain"
                              />
                            </span>
                          )}
                          <div className="min-w-0">
                            <h3 className="text-xl font-semibold tracking-tight">{job.position}</h3>
                            {job.companyUrl ? (
                              <a
                                href={job.companyUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                              >
                                {job.company} <ArrowUpRightIcon className="size-3.5" />
                              </a>
                            ) : (
                              <p className="text-sm text-brand">{job.company}</p>
                            )}
                          </div>
                          {job.currentlyWorking && (
                            <span className="ml-auto rounded-full border border-brand/40 px-2 py-0.5 font-mono text-[10px] uppercase text-brand">
                              Now
                            </span>
                          )}
                        </div>
                        {job.description && (
                          <p className="text-sm leading-relaxed text-muted-foreground">{job.description}</p>
                        )}
                        {job.technologies.length > 0 && (
                          <ul className="flex flex-wrap gap-1.5">
                            {job.technologies.map((t) => (
                              <li key={t} className="rounded-md border bg-background/50 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                                {t}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </MagicCard>
                </Reveal>
              ))}
            </ol>
          </Container>
        </section>
      )}

      {/* ─── 04 · Projects ────────────────────────────────────────── */}
      {shownProjects.length > 0 && (
        <section id="projects" className="scroll-mt-20 py-24 sm:py-32">
          <Container>
            <SectionHeading
              index="03"
              label="selected work"
              title="Things I've built."
              description="From production dashboards to side projects — hover around, they're alive."
            />
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {shownProjects.map((project, i) => (
                <ProjectTile key={project.id} project={project} index={i} wide={i === 0 && shownProjects.length > 2} />
              ))}
            </div>
            {projects.length > shownProjects.length && (
              <Reveal className="mt-10 flex justify-center">
                <Link
                  href="/projects"
                  className="group inline-flex items-center gap-2 rounded-full border bg-background/60 px-5 py-3 font-mono text-sm transition-colors hover:border-brand/60 hover:text-brand"
                >
                  view all {projects.length} projects
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Reveal>
            )}
          </Container>
        </section>
      )}

      {/* ─── 05 · Stack ───────────────────────────────────────────── */}
      {skillGroups.length > 0 && (
        <section id="stack" className="scroll-mt-20 py-24 sm:py-32">
          <Container>
            <SectionHeading
              index="04"
              label="stack"
              title="Tools of the trade."
              description="Grab the sphere and spin it — hover any logo to see what it is."
            />
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_1fr]">
              <Reveal className="relative mx-auto w-full max-w-[520px]">
                <div aria-hidden className="absolute inset-[12%] rounded-full bg-brand/10 blur-3xl" />
                <IconCloud icons={skills.map(skillIcon)} />
              </Reveal>
              <div className="grid gap-4">
              {skillGroups.map((group, i) => (
                <Reveal key={group.category} delay={i * 0.06}>
                  <MagicCard className="h-full p-5">
                    <p className="mb-4 font-mono text-xs uppercase tracking-wider text-brand">
                      ./{group.category.toLowerCase()}
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {group.items.map((skill) => (
                        <li
                          key={skill.id}
                          className="rounded-lg border bg-background/60 px-3 py-1.5 text-sm transition-colors hover:border-brand/50 hover:text-brand"
                        >
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </MagicCard>
                </Reveal>
              ))}
              </div>
            </div>
          </Container>
        </section>
      )}

      {/* ─── 06 · Education, certifications, hackathons ──────────── */}
      {(education.length > 0 || certifications.length > 0 || hackathons.length > 0) && (
        <section id="journey" className="scroll-mt-20 py-24 sm:py-32">
          <Container>
            <SectionHeading index="05" label="journey" title="Learning in public." />
            <div className="grid gap-5 lg:grid-cols-2">
              {education.map((item) => (
                <Reveal key={item.id}>
                  <MagicCard className="h-full p-6">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Education · {formatPeriod(item.startDate, item.endDate, { granularity: "year" })}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">
                      {item.field ? `${item.degree}, ${item.field}` : item.degree}
                    </h3>
                    {item.institutionUrl ? (
                      <a href={item.institutionUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-brand hover:underline">
                        {item.institution}
                      </a>
                    ) : (
                      <p className="text-sm text-brand">{item.institution}</p>
                    )}
                    {(item.description || item.grade) && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {[item.description, item.grade && `Grade: ${item.grade}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </MagicCard>
                </Reveal>
              ))}
              {certifications.map((cert) => (
                <Reveal key={cert.id}>
                  <MagicCard className="h-full p-6">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      Certification · {formatMonthYear(cert.issueDate)}
                    </p>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight">{cert.name}</h3>
                    <p className="text-sm text-brand">{cert.issuer}</p>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground"
                      >
                        verify credential <ArrowUpRightIcon className="size-3" />
                      </a>
                    )}
                  </MagicCard>
                </Reveal>
              ))}
              {hackathons.map((h) => (
                <Reveal key={h.id}>
                  <MagicCard className="h-full p-6">
                    <div className="flex items-start gap-4">
                      {h.image?.url && (
                        // eslint-disable-next-line @next/next/no-img-element -- arbitrary external badge host
                        <img src={h.image.url} alt="" className="size-11 shrink-0 rounded-xl border bg-white object-contain p-1" />
                      )}
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                          Hackathon · {formatEventRange(h.startDate, h.endDate)}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-tight">{h.title}</h3>
                        {h.location && <p className="text-sm text-brand">{h.location}</p>}
                      </div>
                    </div>
                    {h.description && <p className="mt-3 text-sm text-muted-foreground">{h.description}</p>}
                    {h.links.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {h.links.map((l) => (
                          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
                            {l.title} <ArrowUpRightIcon className="size-3" />
                          </a>
                        ))}
                      </div>
                    )}
                  </MagicCard>
                </Reveal>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ─── 07 · Contact ─────────────────────────────────────────── */}
      <section id="contact" className="relative scroll-mt-20 overflow-hidden py-28 sm:py-40">
        <div aria-hidden className="absolute inset-0 bg-grid mask-radial opacity-60" />
        <div aria-hidden className="absolute left-1/2 top-1/2 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[140px]" />
        <Container className="relative flex flex-col items-center text-center">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <span className="text-brand">06</span> / contact
          </p>
          <h2 className="mt-6 max-w-4xl text-[clamp(2.6rem,7vw,6rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-balance">
            <HyperText text="Let's build" className="block" />
            <span className="font-serif font-normal italic text-brand">something remarkable.</span>
          </h2>
          <p className="mt-6 max-w-md text-muted-foreground">
            Open to new roles, freelance projects and interesting conversations. I usually reply within a day.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {email && <CopyEmail email={email} />}
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
              >
                Say hello <ArrowUpRightIcon className="size-4" />
              </a>
            )}
            {resume && (
              <a
                href="/resume"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-5 py-3 text-sm font-medium backdrop-blur transition-colors hover:border-brand/60 hover:text-brand"
              >
                <DownloadIcon className="size-4" /> Download resume
              </a>
            )}
          </div>
          {home && (
            <Reveal className="mt-20 w-full">
              <div className="relative overflow-hidden rounded-3xl border bg-card/40 p-4 text-left backdrop-blur sm:p-8">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-2">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Currently based in</p>
                    <p className="text-2xl font-semibold tracking-tight">{home.name}</p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    <span className="text-brand">●</span> remote-ready across time zones
                  </p>
                </div>
                <DottedMap home={home} destinations={HUBS}>
                  <div className="-translate-x-1/2 translate-y-4 whitespace-nowrap rounded-full border border-brand/40 bg-background/90 px-3 py-1.5 font-mono text-[11px] shadow-[0_8px_30px_-10px_hsl(var(--brand)/0.6)] backdrop-blur sm:text-xs">
                    <span className="text-brand">◉</span> {home.name}
                    {profile.timezone && (
                      <span className="text-muted-foreground">
                        {" · "}
                        <LocalTime timeZone={profile.timezone} />
                      </span>
                    )}
                  </div>
                </DottedMap>
              </div>
            </Reveal>
          )}
        </Container>
      </section>
    </main>
  );
}
