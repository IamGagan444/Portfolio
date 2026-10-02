import "server-only";

import { destroyMedia, type ResourceType } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db/connect";
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

type MediaLike = { publicId?: string | null } | null | undefined;

export function publicIdsOf(...media: (MediaLike | MediaLike[])[]): string[] {
  return media
    .flat()
    .map((m) => m?.publicId ?? "")
    .filter(Boolean);
}

/** Every Cloudinary public id currently referenced by any record. */
export async function referencedPublicIds(): Promise<Set<string>> {
  await connectDB();
  const [projects, experience, education, certifications, hackathons, profile, resumes, skills] =
    await Promise.all([
      Project.find().select("thumbnail images").lean(),
      Experience.find().select("logo").lean(),
      Education.find().select("logo").lean(),
      Certification.find().select("certificateImage").lean(),
      Hackathon.find().select("image").lean(),
      Profile.findOne().select("profileImage heroImages").lean(),
      Resume.find().select("publicId").lean(),
      Skill.find().select("icon").lean(),
    ]);

  const ids = new Set<string>([
    ...projects.flatMap((p) => publicIdsOf(p.thumbnail, p.images)),
    ...experience.flatMap((e) => publicIdsOf(e.logo)),
    ...education.flatMap((e) => publicIdsOf(e.logo)),
    ...certifications.flatMap((c) => publicIdsOf(c.certificateImage)),
    ...hackathons.flatMap((h) => publicIdsOf(h.image)),
    ...publicIdsOf(profile?.profileImage, profile?.heroImages ?? []),
    ...resumes.map((r) => r.publicId).filter(Boolean),
  ]);
  // Skill icons are stored as plain URLs; keep any Cloudinary asset they point at.
  for (const skill of skills) {
    const id = publicIdFromUrl(skill.icon);
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Deletes assets that are no longer referenced anywhere. Duplicated projects
 * share images, so removal always checks every collection first.
 */
export async function destroyIfUnreferenced(publicIds: string[], resourceType: ResourceType = "image") {
  if (publicIds.length === 0) return;
  try {
    const referenced = await referencedPublicIds();
    await destroyMedia(
      publicIds.filter((id) => !referenced.has(id)),
      resourceType,
    );
  } catch (error) {
    console.error("[media] Cleanup failed:", error);
  }
}

/** Extracts the public id from a Cloudinary delivery URL, if it is one. */
export function publicIdFromUrl(url: string): string | null {
  const match = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw)\/upload\/(?:[^/]+\/)*?v\d+\/(.+?)(?:\.[a-z0-9]+)?$/i.exec(
    url,
  );
  return match?.[1] ?? null;
}
