// Shared by client-side pre-checks and server-side enforcement. Kept under the
// ~4.5 MB request-body limit of common serverless hosts.
export const IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const RESUME_MAX_BYTES = 4 * 1024 * 1024;

export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
export const IMAGE_MIME_TYPES = IMAGE_ACCEPT.split(",");

export const IMAGE_FOLDERS = [
  "projects",
  "profile",
  "logos",
  "certifications",
  "skills",
  "hackathons",
] as const;
export type ImageFolder = (typeof IMAGE_FOLDERS)[number];
