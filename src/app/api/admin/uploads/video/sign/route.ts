import { adminRoute, ok } from "@/lib/api/handler";
import { signDirectUpload } from "@/lib/cloudinary";
import { VIDEO_FOLDER, VIDEO_FORMATS, VIDEO_PLAYBACK_TRANSFORM } from "@/lib/upload-limits";

/**
 * Issues a short-lived signature so the browser can upload a video straight to
 * Cloudinary (videos exceed the serverless request-body limit). The signature
 * pins the destination folder and the allowed formats.
 */
export const POST = adminRoute(async () => {
  // Eagerly (async) create a compressed 1280px MP4 for web playback.
  return ok(
    signDirectUpload({ folder: VIDEO_FOLDER, allowedFormats: VIDEO_FORMATS, eager: `${VIDEO_PLAYBACK_TRANSFORM}/mp4` }),
  );
});
