import { z } from "zod";

import {
  dateString,
  endAfterStart,
  linkUrl,
  mediaSchema,
  optionalAssetUrl,
  optionalDate,
  optionalText,
  optionalUrl,
  type RecordMeta,
  requiredText,
  tagList,
} from "./common";

/* ----------------------------------------------------------------------------
 * Projects
 * ------------------------------------------------------------------------- */

export const PROJECT_STATUSES = ["published", "draft"] as const;

export const slugString = z
  .string()
  .trim()
  .toLowerCase()
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens");

const projectBase = z.strictObject({
  title: requiredText("Title", 120),
  slug: z.union([z.literal(""), slugString]),
  shortDescription: requiredText("Short description", 400),
  description: optionalText(20_000),
  thumbnail: mediaSchema.nullable(),
  images: z.array(mediaSchema).max(20, "At most 20 images"),
  video: optionalAssetUrl,
  technologies: tagList,
  category: optionalText(60),
  liveUrl: optionalUrl,
  githubUrl: optionalUrl,
  featured: z.boolean(),
  status: z.enum(PROJECT_STATUSES),
  startDate: optionalDate,
  endDate: optionalDate,
});

export const projectSchema = projectBase.superRefine(endAfterStart);
export const projectPatchSchema = projectBase.partial().superRefine(endAfterStart);
export type ProjectInput = z.infer<typeof projectSchema>;
export type ProjectDTO = ProjectInput & RecordMeta;

/* ----------------------------------------------------------------------------
 * Experience
 * ------------------------------------------------------------------------- */

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Freelance",
  "Self-employed",
] as const;

const experienceBase = z.strictObject({
  company: requiredText("Company", 120),
  companyUrl: optionalUrl,
  logo: mediaSchema.nullable(),
  position: requiredText("Position", 120),
  location: optionalText(120),
  employmentType: z.enum(EMPLOYMENT_TYPES),
  startDate: dateString,
  endDate: optionalDate,
  currentlyWorking: z.boolean(),
  description: optionalText(5000),
  technologies: tagList,
});

export const experienceSchema = experienceBase.superRefine(endAfterStart);
export const experiencePatchSchema = experienceBase.partial().superRefine(endAfterStart);
export type ExperienceInput = z.infer<typeof experienceSchema>;
export type ExperienceDTO = ExperienceInput & RecordMeta;

/* ----------------------------------------------------------------------------
 * Skills
 * ------------------------------------------------------------------------- */

export const SKILL_CATEGORIES = [
  "Frontend",
  "Backend",
  "Database",
  "DevOps",
  "Tools",
  "Other",
] as const;

const skillBase = z.strictObject({
  name: requiredText("Name", 60),
  category: z.enum(SKILL_CATEGORIES),
  proficiency: z
    .number({ error: "Proficiency must be a number" })
    .int()
    .min(0, "Minimum is 0")
    .max(100, "Maximum is 100"),
  icon: optionalAssetUrl,
});

export const skillSchema = skillBase;
export const skillPatchSchema = skillBase.partial();
export type SkillInput = z.infer<typeof skillSchema>;
export type SkillDTO = SkillInput & RecordMeta;

/* ----------------------------------------------------------------------------
 * Education
 * ------------------------------------------------------------------------- */

const educationBase = z.strictObject({
  institution: requiredText("Institution", 160),
  institutionUrl: optionalUrl,
  logo: mediaSchema.nullable(),
  degree: requiredText("Degree", 120),
  field: optionalText(120),
  startDate: dateString,
  endDate: optionalDate,
  description: optionalText(5000),
  grade: optionalText(60),
});

export const educationSchema = educationBase.superRefine(endAfterStart);
export const educationPatchSchema = educationBase.partial().superRefine(endAfterStart);
export type EducationInput = z.infer<typeof educationSchema>;
export type EducationDTO = EducationInput & RecordMeta;

/* ----------------------------------------------------------------------------
 * Certifications
 * ------------------------------------------------------------------------- */

const certificationBase = z.strictObject({
  name: requiredText("Name", 160),
  issuer: requiredText("Issuer", 120),
  issueDate: dateString,
  expiryDate: optionalDate,
  credentialId: optionalText(120),
  credentialUrl: optionalUrl,
  certificateImage: mediaSchema.nullable(),
});

function expiryAfterIssue(
  value: { issueDate?: string; expiryDate?: string },
  ctx: z.RefinementCtx,
) {
  if (value.issueDate && value.expiryDate && new Date(value.expiryDate) < new Date(value.issueDate)) {
    ctx.addIssue({ code: "custom", path: ["expiryDate"], message: "Expiry must be after issue date" });
  }
}

export const certificationSchema = certificationBase.superRefine(expiryAfterIssue);
export const certificationPatchSchema = certificationBase.partial().superRefine(expiryAfterIssue);
export type CertificationInput = z.infer<typeof certificationSchema>;
export type CertificationDTO = CertificationInput & RecordMeta;

/* ----------------------------------------------------------------------------
 * Hackathons (existing portfolio section)
 * ------------------------------------------------------------------------- */

const hackathonBase = z.strictObject({
  title: requiredText("Title", 160),
  location: optionalText(120),
  startDate: dateString,
  endDate: optionalDate,
  description: optionalText(5000),
  image: mediaSchema.nullable(),
  links: z
    .array(z.strictObject({ title: requiredText("Link title", 60), url: linkUrl }))
    .max(10, "At most 10 links"),
});

export const hackathonSchema = hackathonBase.superRefine(endAfterStart);
export const hackathonPatchSchema = hackathonBase.partial().superRefine(endAfterStart);
export type HackathonInput = z.infer<typeof hackathonSchema>;
export type HackathonDTO = HackathonInput & RecordMeta;

/* ----------------------------------------------------------------------------
 * Profile
 * ------------------------------------------------------------------------- */

export const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "x",
  "instagram",
  "youtube",
  "email",
  "website",
  "other",
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export const socialLinkSchema = z.strictObject({
  platform: z.enum(SOCIAL_PLATFORMS),
  label: requiredText("Label", 40),
  url: linkUrl,
  showInNav: z.boolean(),
});

export const profileSchema = z.strictObject({
  name: requiredText("Name", 80),
  headline: requiredText("Headline", 300),
  roles: z.array(z.string().trim().min(1).max(60, "Roles must be at most 60 characters")).max(8, "At most 8 roles"),
  bio: optionalText(10_000),
  profileImage: mediaSchema.nullable(),
  heroImages: z.array(mediaSchema).max(6, "At most 6 hero images"),
  location: optionalText(120),
  locationUrl: optionalUrl,
  email: z.union([z.literal(""), z.email("Invalid email").max(254)]),
  phone: z.union([
    z.literal(""),
    z.string().trim().regex(/^\+?[\d\s()-]{6,20}$/, "Invalid phone number"),
  ]),
  availability: optionalText(120),
  socialLinks: z.array(socialLinkSchema).max(20, "At most 20 links"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;
export type ProfileDTO = ProfileInput & { id: string; updatedAt: string };

/* ----------------------------------------------------------------------------
 * Resume
 * ------------------------------------------------------------------------- */

export const resumePatchSchema = z
  .strictObject({
    title: requiredText("Title", 120).optional(),
    isActive: z.literal(true).optional(),
  })
  .refine((v) => v.title !== undefined || v.isActive !== undefined, "Nothing to update");

export const resumeUploadFieldsSchema = z.strictObject({
  title: requiredText("Title", 120),
  makeActive: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export type ResumeDTO = {
  id: string;
  title: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  version: number;
  isActive: boolean;
  uploadedAt: string;
};
