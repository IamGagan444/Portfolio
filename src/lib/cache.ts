import "server-only";

import { revalidateTag } from "next/cache";

export const TAGS = {
  profile: "profile",
  projects: "projects",
  experience: "experience",
  skills: "skills",
  education: "education",
  certifications: "certifications",
  hackathons: "hackathons",
  resume: "resume",
} as const;

export type CacheTag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Expires cached public data immediately (no stale window) so the next visit
 * to any page that read these tags re-renders with fresh database content.
 */
export function invalidate(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

export function invalidateAll() {
  invalidate(...Object.values(TAGS));
}
