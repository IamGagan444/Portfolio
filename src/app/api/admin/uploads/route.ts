import { ApiError } from "@/lib/api/errors";
import { adminRoute, ok } from "@/lib/api/handler";
import { uploadBuffer } from "@/lib/cloudinary";
import { IMAGE_FOLDERS, IMAGE_MAX_BYTES, type ImageFolder } from "@/lib/upload-limits";
import { detectImageFormat, readFileField, readFormData } from "@/lib/uploads";

/**
 * Accepts one image, verifies its real format from the file bytes, and stores
 * it in Cloudinary. Oversized images are downscaled and recompressed on ingest.
 */
export const POST = adminRoute(async (req) => {
  const form = await readFormData(req);
  const folder = String(form.get("folder") ?? "");
  if (!IMAGE_FOLDERS.includes(folder as ImageFolder)) throw new ApiError(400, "Invalid upload folder");

  const { buffer } = await readFileField(form, "file", IMAGE_MAX_BYTES);
  const format = detectImageFormat(buffer);
  if (!format) {
    throw new ApiError(415, "Unsupported image type", { file: "Use JPEG, PNG, WebP, GIF or AVIF" });
  }

  const result = await uploadBuffer(buffer, {
    folder,
    resource_type: "image",
    transformation: [{ width: 2400, height: 2400, crop: "limit", quality: "auto:good" }],
  });

  return ok(
    {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format,
    },
    { status: 201 },
  );
});
