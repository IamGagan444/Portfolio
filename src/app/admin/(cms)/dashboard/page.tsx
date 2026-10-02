import {
  ArrowUpRightIcon,
  AwardIcon,
  BriefcaseIcon,
  FileTextIcon,
  FolderKanbanIcon,
  GraduationCapIcon,
  SparklesIcon,
  StarIcon,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/admin/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAdminPage } from "@/lib/auth/guard";
import { connectDB } from "@/lib/db/connect";
import { formatBytes, formatFullDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Certification, Education, Experience, Hackathon, Profile, Project, Resume, Skill } from "@/models";

export const metadata: Metadata = { title: "Dashboard" };

type Update = { label: string; kind: string; href: string; updatedAt: Date };

/** Live counts read straight from the database (never cached — admin only). */
async function loadDashboard() {
  await connectDB();
  const recent = (sel: string) => ({ sort: { updatedAt: -1 as const }, limit: 5, select: sel });
  const [
    projects,
    featured,
    published,
    skills,
    experience,
    education,
    certifications,
    activeResume,
    recentProjects,
    recentExperience,
    recentEducation,
    recentCerts,
    recentHackathons,
    profile,
  ] = await Promise.all([
    Project.countDocuments(),
    Project.countDocuments({ featured: true }),
    Project.countDocuments({ status: "published" }),
    Skill.countDocuments(),
    Experience.countDocuments(),
    Education.countDocuments(),
    Certification.countDocuments(),
    Resume.findOne({ isActive: true }).lean(),
    Project.find({}, null, recent("title updatedAt")).lean(),
    Experience.find({}, null, recent("company updatedAt")).lean(),
    Education.find({}, null, recent("institution updatedAt")).lean(),
    Certification.find({}, null, recent("name updatedAt")).lean(),
    Hackathon.find({}, null, recent("title updatedAt")).lean(),
    Profile.findOne().select("name updatedAt").lean(),
  ]);

  const updates: Update[] = [
    ...recentProjects.map((p) => ({ label: p.title, kind: "Project", href: `/admin/projects/${p._id}`, updatedAt: p.updatedAt })),
    ...recentExperience.map((e) => ({ label: e.company, kind: "Experience", href: "/admin/experience", updatedAt: e.updatedAt })),
    ...recentEducation.map((e) => ({ label: e.institution, kind: "Education", href: "/admin/education", updatedAt: e.updatedAt })),
    ...recentCerts.map((c) => ({ label: c.name, kind: "Certification", href: "/admin/certifications", updatedAt: c.updatedAt })),
    ...recentHackathons.map((h) => ({ label: h.title, kind: "Hackathon", href: "/admin/hackathons", updatedAt: h.updatedAt })),
    ...(profile ? [{ label: profile.name, kind: "Profile", href: "/admin/profile", updatedAt: profile.updatedAt }] : []),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 8);

  return { projects, featured, published, skills, experience, education, certifications, activeResume, updates };
}

export default async function DashboardPage() {
  const admin = await requireAdminPage();
  const data = await loadDashboard();

  const stats = [
    { label: "Projects", value: data.projects, note: `${data.published} published`, href: "/admin/projects", icon: FolderKanbanIcon },
    { label: "Featured", value: data.featured, note: "on homepage", href: "/admin/projects", icon: StarIcon },
    { label: "Skills", value: data.skills, note: "badges", href: "/admin/skills", icon: SparklesIcon },
    { label: "Experience", value: data.experience, note: "roles", href: "/admin/experience", icon: BriefcaseIcon },
    { label: "Education", value: data.education, note: "entries", href: "/admin/education", icon: GraduationCapIcon },
    { label: "Certifications", value: data.certifications, note: "credentials", href: "/admin/certifications", icon: AwardIcon },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${admin.name.split(" ")[0]}.`}
        description="Everything you publish here appears on your portfolio immediately."
        actions={
          <a href="/" target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}>
            View site <ArrowUpRightIcon className="size-3.5" />
          </a>
        }
      />

      <section aria-label="Content totals" className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-3">
        {stats.map(({ label, value, note, href, icon: Icon }) => (
          <Link key={label} href={href} className="group bg-background p-5 transition-colors hover:bg-muted/40">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-lg border bg-background">
          <header className="flex items-center justify-between border-b px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent updates</h2>
          </header>
          {data.updates.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No content yet. Run the seed script or add content.</p>
          ) : (
            <ul className="divide-y">
              {data.updates.map((u) => (
                <li key={`${u.kind}-${u.href}-${u.label}`}>
                  <Link href={u.href} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/40">
                    <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{u.kind}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{u.label}</span>
                    <time className="shrink-0 font-mono text-xs text-muted-foreground">{formatFullDate(u.updatedAt.toISOString())}</time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-background">
          <header className="border-b px-5 py-3.5">
            <h2 className="text-sm font-semibold">Current resume</h2>
          </header>
          <div className="space-y-4 p-5">
            {data.activeResume ? (
              <>
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-muted font-mono text-xs">
                    v{data.activeResume.version}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{data.activeResume.title}</p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {formatBytes(data.activeResume.fileSize)} · {formatFullDate(data.activeResume.uploadedAt.toISOString())}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href="/resume" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Open
                  </a>
                  <Link href="/admin/resume" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                    Manage
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-3 text-sm text-muted-foreground">
                <FileTextIcon className="size-5" />
                <p>No resume is live yet. The Download Resume button stays hidden until you upload one.</p>
                <Link href="/admin/resume" className={buttonVariants({ size: "sm" })}>
                  Upload resume
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
