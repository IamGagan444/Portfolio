import "server-only";

import { ApiError } from "@/lib/api/errors";

import { IMAGE_MAX_BYTES } from "./upload-limits";

export type ImageFormat = "jpeg" | "png" | "webp" | "gif" | "avif";

/**
 * Identifies an image by its leading bytes rather than trusting the
 * client-supplied MIME type or extension. SVG is intentionally not accepted
 * because it can carry script.
 */
export function detectImageFormat(buf: Buffer): ImageFormat | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "gif";
  if (buf.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(buf.toString("ascii", 8, 12))) return "avif";
  return null;
}

export function isPdf(buf: Buffer): boolean {
  return buf.length > 5 && buf.toString("ascii", 0, 5) === "%PDF-";
}

/** Reads a file field from multipart form data, enforcing presence and size. */
export async function readFileField(
  form: FormData,
  field: string,
  maxBytes: number = IMAGE_MAX_BYTES,
): Promise<{ file: File; buffer: Buffer }> {
  const file = form.get(field);
  if (!(file instanceof File)) throw new ApiError(400, "No file provided", { [field]: "Choose a file" });
  if (file.size === 0) throw new ApiError(400, "The file is empty", { [field]: "The file is empty" });
  if (file.size > maxBytes) {
    const mb = (maxBytes / 1024 / 1024).toFixed(0);
    throw new ApiError(413, `File is larger than ${mb} MB`, { [field]: `Max size is ${mb} MB` });
  }
  return { file, buffer: Buffer.from(await file.arrayBuffer()) };
}

/** Parses multipart form data with a clear error for malformed requests. */
export async function readFormData(req: Request): Promise<FormData> {
  try {
    return await req.formData();
  } catch {
    throw new ApiError(400, "Expected multipart form data");
  }
}

/** Filename safe for storage and display. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 120);
  return cleaned || "file";
}
