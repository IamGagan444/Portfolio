"use client";

import { AwardIcon, BriefcaseIcon, GraduationCapIcon, SparklesIcon, TrophyIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatEventRange, formatMonthYear, formatPeriod } from "@/lib/format";
import {
  type CertificationDTO,
  EMPLOYMENT_TYPES,
  type EducationDTO,
  type ExperienceDTO,
  type HackathonDTO,
  SKILL_CATEGORIES,
  type SkillDTO,
} from "@/lib/validations/portfolio";

import { CertificationForm } from "./forms/certification-form";
import { EducationForm } from "./forms/education-form";
import { ExperienceForm } from "./forms/experience-form";
import { HackathonForm } from "./forms/hackathon-form";
import { SkillForm } from "./forms/skill-form";
import { ResourceManager } from "./resource-manager";

function Thumb({ src, alt, fallback }: { src?: string; alt: string; fallback: string }) {
  return (
    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted text-xs font-medium text-muted-foreground">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin thumbnail of arbitrary hosts
        <img src={src} alt={alt} className="size-full object-contain" />
      ) : (
        fallback.slice(0, 1).toUpperCase()
      )}
    </div>
  );
}

function Row({
  thumb,
  title,
  subtitle,
  meta,
}: {
  thumb?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  meta?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {thumb}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{title}</p>
        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {meta && <div className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:block">{meta}</div>}
    </div>
  );
}

const has = (value: string | undefined, q: string) => Boolean(value?.toLowerCase().includes(q));

export function ExperienceManager() {
  return (
    <ResourceManager<ExperienceDTO>
      resource="experience"
      title="Experience"
      singular="Experience"
      description="Roles shown in the Work Experience section."
      searchPlaceholder="Search company, role, technology…"
      emptyIcon={BriefcaseIcon}
      matches={(e, q) =>
        has(e.company, q) || has(e.position, q) || has(e.location, q) || e.technologies.some((t) => has(t, q))
      }
      filters={[
        {
          key: "employmentType",
          label: "Types",
          options: EMPLOYMENT_TYPES,
          matches: (e, v) => e.employmentType === v,
        },
      ]}
      itemLabel={(e) => `${e.position} at ${e.company}`}
      renderRow={(e) => (
        <Row
          thumb={<Thumb src={e.logo?.url} alt={e.company} fallback={e.company} />}
          title={
            <>
              {e.company}
              {e.currentlyWorking && (
                <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px]">
                  Current
                </Badge>
              )}
            </>
          }
          subtitle={`${e.position} · ${e.employmentType}${e.location ? ` · ${e.location}` : ""}`}
          meta={formatPeriod(e.startDate, e.endDate, { current: e.currentlyWorking })}
        />
      )}
      Form={ExperienceForm}
    />
  );
}

export function SkillsManager() {
  return (
    <ResourceManager<SkillDTO>
      resource="skills"
      title="Skills"
      singular="Skill"
      description="Badges shown in the Skills section, in this order."
      searchPlaceholder="Search skills…"
      emptyIcon={SparklesIcon}
      dialogClassName="max-w-lg"
      matches={(s, q) => has(s.name, q) || has(s.category, q)}
      filters={[{ key: "category", label: "Categories", options: SKILL_CATEGORIES, matches: (s, v) => s.category === v }]}
      itemLabel={(s) => s.name}
      renderRow={(s) => (
        <Row
          title={s.name}
          subtitle={s.category}
          meta={
            s.proficiency > 0 ? (
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full bg-foreground" style={{ width: `${s.proficiency}%` }} />
                </span>
                {s.proficiency}%
              </span>
            ) : (
              "—"
            )
          }
        />
      )}
      Form={SkillForm}
    />
  );
}

export function EducationManager() {
  return (
    <ResourceManager<EducationDTO>
      resource="education"
      title="Education"
      singular="Education entry"
      description="Degrees and schools shown in the Education section."
      searchPlaceholder="Search institution or degree…"
      emptyIcon={GraduationCapIcon}
      matches={(e, q) => has(e.institution, q) || has(e.degree, q) || has(e.field, q)}
      itemLabel={(e) => `${e.degree} — ${e.institution}`}
      renderRow={(e) => (
        <Row
          thumb={<Thumb src={e.logo?.url} alt={e.institution} fallback={e.institution} />}
          title={e.institution}
          subtitle={[e.degree, e.field, e.grade].filter(Boolean).join(" · ")}
          meta={formatPeriod(e.startDate, e.endDate, { granularity: "year" })}
        />
      )}
      Form={EducationForm}
    />
  );
}

export function CertificationsManager() {
  return (
    <ResourceManager<CertificationDTO>
      resource="certifications"
      title="Certifications"
      singular="Certification"
      description="Shown in the Certifications section once you add one."
      searchPlaceholder="Search name, issuer, credential ID…"
      emptyIcon={AwardIcon}
      matches={(c, q) => has(c.name, q) || has(c.issuer, q) || has(c.credentialId, q)}
      itemLabel={(c) => c.name}
      renderRow={(c) => {
        const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
        return (
          <Row
            thumb={<Thumb src={c.certificateImage?.url} alt={c.issuer} fallback={c.issuer} />}
            title={
              <>
                {c.name}
                {expired && (
                  <Badge variant="outline" className="ml-2 px-1.5 py-0 text-[10px] text-destructive">
                    Expired
                  </Badge>
                )}
              </>
            }
            subtitle={c.issuer}
            meta={formatMonthYear(c.issueDate)}
          />
        );
      }}
      Form={CertificationForm}
    />
  );
}

export function HackathonsManager() {
  return (
    <ResourceManager<HackathonDTO>
      resource="hackathons"
      title="Hackathons"
      singular="Hackathon"
      description="Entries in the Hackathons timeline."
      searchPlaceholder="Search hackathons…"
      emptyIcon={TrophyIcon}
      matches={(h, q) => has(h.title, q) || has(h.location, q) || has(h.description, q)}
      itemLabel={(h) => h.title}
      renderRow={(h) => (
        <Row
          thumb={<Thumb src={h.image?.url} alt={h.title} fallback={h.title} />}
          title={h.title}
          subtitle={h.location}
          meta={formatEventRange(h.startDate, h.endDate)}
        />
      )}
      Form={HackathonForm}
    />
  );
}
