import "server-only";

import { unstable_cache } from "next/cache";
import { cache } from "react";

import { TAGS } from "@/lib/cache";
import { connectDB } from "@/lib/db/connect";
import { profileDTO, toDTO } from "@/lib/db/dto";
import type {
  CertificationDTO,
  EducationDTO,
  ExperienceDTO,
  HackathonDTO,
  ProfileDTO,
  ProjectDTO,
  ResumeDTO,
  SkillDTO,
} from "@/lib/validations/portfolio";
import {
  Certification,
  Education,
  Experience,
  Hackathon,
  Profile,
  Project,
  Resume,
  Skill,
} from "@/models";

/*
 * Public, read-only data access. Every getter is cached in the Next.js Data
 * Cache under a resource tag, so the database is only queried after an admin
 * mutation invalidates that tag (or after the daily safety-net revalidation).
 * React `cache` de-duplicates calls within a single render.
 */

const DAY = 60 * 60 * 24;
// Bump when a DTO's shape changes so stale cache entries are never read.
const CACHE_VERSION = "v3";
const ORDER = { order: 1, createdAt: -1 } as const;

function cached<Args extends unknown[], R>(
  fn: (...args: Args) => Promise<R>,
  key: string,
  tags: string[],
) {
  return cache(unstable_cache(fn, [CACHE_VERSION, key], { tags, revalidate: DAY }));
}

async function loadProfile(): Promise<ProfileDTO | null> {
  await connectDB();
  const doc = await Profile.findOne().lean();
  // Older profile documents may predate `roles`/`heroImages`.
  return doc ? profileDTO(doc) : null;
}

const getCachedProfile = unstable_cache(loadProfile, [CACHE_VERSION, "profile"], { tags: [TAGS.profile], revalidate: DAY });

/**
 * A cached "no profile" may predate seeding (the seed script runs outside
 * Next.js and can't invalidate the cache), so a miss is re-checked live.
 */
export const getProfile = cache(async (): Promise<ProfileDTO | null> => {
  return (await getCachedProfile()) ?? loadProfile();
});

export const getPublishedProjects = cached(
  async (): Promise<ProjectDTO[]> => {
    await connectDB();
    const docs = await Project.find({ status: "published" }).sort(ORDER).lean();
    return docs.map((d) => toDTO<ProjectDTO>(d, ["startDate", "endDate"]));
  },
  "projects:published",
  [TAGS.projects],
);

export const getProjectBySlug = cached(
  async (slug: string): Promise<ProjectDTO | null> => {
    await connectDB();
    const doc = await Project.findOne({ slug, status: "published" }).lean();
    return doc ? toDTO<ProjectDTO>(doc, ["startDate", "endDate"]) : null;
  },
  "projects:slug",
  [TAGS.projects],
);

export const getExperience = cached(
  async (): Promise<ExperienceDTO[]> => {
    await connectDB();
    const docs = await Experience.find().sort(ORDER).lean();
    return docs.map((d) => toDTO<ExperienceDTO>(d, ["startDate", "endDate"]));
  },
  "experience",
  [TAGS.experience],
);

export const getSkills = cached(
  async (): Promise<SkillDTO[]> => {
    await connectDB();
    const docs = await Skill.find().sort(ORDER).lean();
    return docs.map((d) => toDTO<SkillDTO>(d));
  },
  "skills",
  [TAGS.skills],
);

export const getEducation = cached(
  async (): Promise<EducationDTO[]> => {
    await connectDB();
    const docs = await Education.find().sort(ORDER).lean();
    return docs.map((d) => toDTO<EducationDTO>(d, ["startDate", "endDate"]));
  },
  "education",
  [TAGS.education],
);

export const getCertifications = cached(
  async (): Promise<CertificationDTO[]> => {
    await connectDB();
    const docs = await Certification.find().sort(ORDER).lean();
    return docs.map((d) => toDTO<CertificationDTO>(d, ["issueDate", "expiryDate"]));
  },
  "certifications",
  [TAGS.certifications],
);

export const getHackathons = cached(
  async (): Promise<HackathonDTO[]> => {
    await connectDB();
    const docs = await Hackathon.find().sort(ORDER).lean();
    return docs.map((d) => toDTO<HackathonDTO>(d, ["startDate", "endDate"]));
  },
  "hackathons",
  [TAGS.hackathons],
);

export const getActiveResume = cached(
  async (): Promise<ResumeDTO | null> => {
    await connectDB();
    const doc = await Resume.findOne({ isActive: true }).lean();
    return doc ? toDTO<ResumeDTO>(doc) : null;
  },
  "resume:active",
  [TAGS.resume],
);
