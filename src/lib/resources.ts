import "server-only";

import mongoose from "mongoose";

import type { ResourceConfig } from "@/lib/api/crud";
import { TAGS } from "@/lib/cache";
import { publicIdFromUrl, publicIdsOf } from "@/lib/media";
import type { Media } from "@/lib/validations/common";
import {
  certificationPatchSchema,
  certificationSchema,
  educationPatchSchema,
  educationSchema,
  experiencePatchSchema,
  experienceSchema,
  hackathonPatchSchema,
  hackathonSchema,
  projectPatchSchema,
  projectSchema,
  skillPatchSchema,
  skillSchema,
} from "@/lib/validations/portfolio";
import { slugify } from "@/lib/slug";
import {
  Certification,
  Education,
  Experience,
  Hackathon,
  Project,
  Skill,
} from "@/models";
import type { CertificationDoc } from "@/models/Certification";
import type { EducationDoc } from "@/models/Education";
import type { ExperienceDoc } from "@/models/Experience";
import type { HackathonDoc } from "@/models/Hackathon";
import type { ProjectDoc } from "@/models/Project";
import type { SkillDoc } from "@/models/Skill";

type Data = Record<string, unknown>;

const media = (value: unknown) => value as Media | null | undefined;
const dedupe = (list: unknown) =>
  Array.isArray(list)
    ? [...new Map((list as string[]).map((t) => [t.toLowerCase(), t])).values()]
    : list;

/** Returns `base`, or `base-2`, `base-3`… — the first slug not used by another project. */
export async function uniqueProjectSlug(base: string, excludeId?: string) {
  const root = base || "project";
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    const filter: Data = { slug: candidate };
    if (excludeId) filter._id = mongoose.trusted({ $ne: new mongoose.Types.ObjectId(excludeId) });
    if (!(await Project.exists(filter))) return candidate;
  }
  throw new Error("Could not generate a unique slug");
}

export const projectResource: ResourceConfig<ProjectDoc> = {
  label: "Project",
  model: Project,
  createSchema: projectSchema,
  patchSchema: projectPatchSchema,
  tags: [TAGS.projects],
  dateFields: ["startDate", "endDate"],
  searchFields: ["title", "shortDescription", "category", "technologies"],
  filters: {
    status: (v) => (v === "published" || v === "draft" ? { status: v } : null),
    featured: (v) => (v === "true" ? { featured: true } : v === "false" ? { featured: false } : null),
    category: (v) => ({ category: v.slice(0, 60) }),
  },
  mediaOf: (doc) => [
    ...publicIdsOf(media(doc.thumbnail), (doc.images as Media[] | undefined) ?? []),
    ...[publicIdFromUrl(typeof doc.video === "string" ? doc.video : "")].filter((id): id is string => Boolean(id)),
  ],
  async prepare(data, { id, existing }) {
    const out = { ...data };
    if ("technologies" in out) out.technologies = dedupe(out.technologies);

    // Slug: explicit value wins; otherwise derive from the title. Always unique.
    if ("slug" in out || !existing) {
      const title = (out.title ?? existing?.title ?? "") as string;
      const requested = (out.slug as string | undefined) || slugify(title);
      out.slug = await uniqueProjectSlug(requested, id);
    }

    // Thumbnail must be one of the gallery images (or an external URL); default to the first.
    if ("images" in out || "thumbnail" in out) {
      const images = ((out.images ?? existing?.images) as Media[] | undefined) ?? [];
      const thumb = ("thumbnail" in out ? out.thumbnail : existing?.thumbnail) as Media | null;
      const inGallery = thumb && images.some((img) => img.url === thumb.url);
      const external = thumb && !thumb.publicId;
      out.thumbnail = inGallery || external ? thumb : (images[0] ?? null);
    }
    return out;
  },
};

export const experienceResource: ResourceConfig<ExperienceDoc> = {
  label: "Experience",
  model: Experience,
  createSchema: experienceSchema,
  patchSchema: experiencePatchSchema,
  tags: [TAGS.experience],
  dateFields: ["startDate", "endDate"],
  searchFields: ["company", "position", "location", "technologies"],
  filters: {
    employmentType: (v) => ({ employmentType: v.slice(0, 40) }),
  },
  mediaOf: (doc) => publicIdsOf(media(doc.logo)),
  prepare(data, { existing }) {
    const out = { ...data };
    if ("technologies" in out) out.technologies = dedupe(out.technologies);
    const current = (out.currentlyWorking ?? existing?.currentlyWorking) as boolean | undefined;
    if (current) out.endDate = null;
    return out;
  },
};

export const skillResource: ResourceConfig<SkillDoc> = {
  label: "Skill",
  model: Skill,
  createSchema: skillSchema,
  patchSchema: skillPatchSchema,
  tags: [TAGS.skills],
  dateFields: [],
  searchFields: ["name", "category"],
  filters: {
    category: (v) => ({ category: v.slice(0, 40) }),
  },
  mediaOf: () => [],
};

export const educationResource: ResourceConfig<EducationDoc> = {
  label: "Education entry",
  model: Education,
  createSchema: educationSchema,
  patchSchema: educationPatchSchema,
  tags: [TAGS.education],
  dateFields: ["startDate", "endDate"],
  searchFields: ["institution", "degree", "field"],
  mediaOf: (doc) => publicIdsOf(media(doc.logo)),
};

export const certificationResource: ResourceConfig<CertificationDoc> = {
  label: "Certification",
  model: Certification,
  createSchema: certificationSchema,
  patchSchema: certificationPatchSchema,
  tags: [TAGS.certifications],
  dateFields: ["issueDate", "expiryDate"],
  searchFields: ["name", "issuer", "credentialId"],
  mediaOf: (doc) => publicIdsOf(media(doc.certificateImage)),
};

export const hackathonResource: ResourceConfig<HackathonDoc> = {
  label: "Hackathon",
  model: Hackathon,
  createSchema: hackathonSchema,
  patchSchema: hackathonPatchSchema,
  tags: [TAGS.hackathons],
  dateFields: ["startDate", "endDate"],
  searchFields: ["title", "location", "description"],
  mediaOf: (doc) => publicIdsOf(media(doc.image)),
};
