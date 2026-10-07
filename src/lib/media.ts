import "server-only";

import { destroyMedia, type ResourceType } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db/connect";
import { VIDEO_FOLDER } from "@/lib/upload-limits";
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
      Project.find().select("thumbnail images video").lean(),
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
    ...projects.map((p) => publicIdFromUrl(p.video ?? "")).filter((id): id is string => Boolean(id)),
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
    const unused = publicIds.filter((id) => !referenced.has(id));
    // Videos live under <root>/videos/ and must be deleted as Cloudinary "video" assets.
    const isVideo = (id: string) => id.includes(`/${VIDEO_FOLDER}/`);
    await Promise.all([
      destroyMedia(unused.filter((id) => !isVideo(id)), resourceType),
      destroyMedia(unused.filter(isVideo), "video"),
    ]);
  } catch (error) {
    console.error("[media] Cleanup failed:", error);
  }
}

/** Extracts the public id from a Cloudinary delivery URL, if it is one. */
export function publicIdFromUrl(url: string): string | null {
  const match = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(?:image|raw|video)\/upload\/(?:[^/]+\/)*?v\d+\/(.+?)(?:\.[a-z0-9]+)?$/i.exec(
    url,
  );
  return match?.[1] ?? null;
}
