import { z } from "zod";

import { ApiError } from "@/lib/api/errors";
import { adminRoute, ok, parseJson } from "@/lib/api/handler";
import { destroyMedia, getAsset, mediaRoot } from "@/lib/cloudinary";
import { VIDEO_FOLDER, VIDEO_FORMATS, VIDEO_MAX_BYTES } from "@/lib/upload-limits";

const bodySchema = z.strictObject({ publicId: z.string().trim().min(1).max(300) });

/**
 * Server-side check of a direct upload: it must live in our video folder, be
 * an allowed format and fit the size limit. Anything else is deleted.
 */
export const POST = adminRoute(async (req) => {
  const { publicId } = await parseJson(req, bodySchema);
  if (!publicId.startsWith(`${mediaRoot()}/${VIDEO_FOLDER}/`)) throw new ApiError(400, "Invalid video");

  let asset;
  try {
    asset = await getAsset(publicId, "video");
  } catch {
    throw new ApiError(404, "Uploaded video not found");
  }

  const allowed = (VIDEO_FORMATS as readonly string[]).includes(asset.format);
  if (!allowed || asset.bytes > VIDEO_MAX_BYTES) {
    await destroyMedia([publicId], "video");
    throw new ApiError(
      asset.bytes > VIDEO_MAX_BYTES ? 413 : 415,
      asset.bytes > VIDEO_MAX_BYTES ? "Video is larger than 50 MB" : "Unsupported video format",
    );
  }

  return ok({
    url: asset.secure_url,
    publicId: asset.public_id,
    bytes: asset.bytes,
    duration: asset.duration ?? null,
    width: asset.width ?? null,
    height: asset.height ?? null,
  });
});
