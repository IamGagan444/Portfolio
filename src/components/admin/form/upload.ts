"use client";

import { api } from "@/lib/admin/api-client";
import { IMAGE_MAX_BYTES, IMAGE_MIME_TYPES, type ImageFolder } from "@/lib/upload-limits";
import type { Media } from "@/lib/validations/common";

/** Client-side pre-check for fast feedback. The server re-validates the bytes. */
export function validateImageFile(file: File): string | null {
  if (!IMAGE_MIME_TYPES.includes(file.type)) return `${file.name}: use JPEG, PNG, WebP, GIF or AVIF`;
  if (file.size > IMAGE_MAX_BYTES) return `${file.name}: larger than ${IMAGE_MAX_BYTES / 1024 / 1024} MB`;
  return null;
}

export async function uploadImage(file: File, folder: ImageFolder): Promise<Media> {
  const body = new FormData();
  body.append("file", file);
  body.append("folder", folder);
  const result = await api<{ url: string; publicId: string }>("/api/admin/uploads", { method: "POST", body });
  return { url: result.url, publicId: result.publicId, alt: "" };
}
