import "server-only";

import { type UploadApiOptions, type UploadApiResponse, v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

export type ResourceType = "image" | "raw" | "video";

let configured = false;

function client() {
  if (!configured) {
    const { cloudName, apiKey, apiSecret } = env.cloudinary;
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    configured = true;
  }
  return cloudinary;
}

export function mediaRoot() {
  return env.cloudinary.folder;
}

/**
 * Signature for a direct browser → Cloudinary upload. Only the parameters
 * signed here are accepted, so the client can't change folder or formats.
 */
export function signDirectUpload(params: { folder: string; allowedFormats: readonly string[]; eager?: string }) {
  const api = client();
  const { cloudName, apiKey, apiSecret } = env.cloudinary;
  const signed = {
    timestamp: Math.round(Date.now() / 1000),
    folder: `${mediaRoot()}/${params.folder}`,
    allowed_formats: params.allowedFormats.join(","),
    ...(params.eager ? { eager: params.eager, eager_async: "true" } : {}),
  };
  return {
    cloudName,
    apiKey,
    ...signed,
    signature: api.utils.api_sign_request(signed, apiSecret),
  };
}

/** Looks up a stored asset's real metadata (size, format, duration). */
export async function getAsset(publicId: string, resourceType: ResourceType) {
  const result = (await client().api.resource(publicId, { resource_type: resourceType })) as {
    public_id: string;
    secure_url: string;
    bytes: number;
    format: string;
    duration?: number;
    width?: number;
    height?: number;
  };
  return result;
}

export function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions & { folder: string; resource_type: ResourceType },
): Promise<UploadApiResponse> {
  const api = client();
  return new Promise((resolve, reject) => {
    api.uploader
      .upload_stream(
        { ...options, folder: `${mediaRoot()}/${options.folder}`, overwrite: false },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result);
        },
      )
      .end(buffer);
  });
}

/** Deletes assets from Cloudinary. Failures are logged; they never fail the caller. */
export async function destroyMedia(publicIds: string[], resourceType: ResourceType = "image") {
  const ids = [...new Set(publicIds.filter(Boolean))];
  if (ids.length === 0) return;
  const api = client();
  await Promise.all(
    ids.map(async (id) => {
      try {
        await api.uploader.destroy(id, { resource_type: resourceType, invalidate: true });
      } catch (error) {
        console.error(`[cloudinary] Failed to delete ${id}:`, error);
      }
    }),
  );
}

/**
 * Fetches a raw asset (e.g. a PDF) through Cloudinary's signed download API.
 * Unlike public delivery URLs, this works even when the account restricts
 * PDF/ZIP delivery (the default on free plans).
 */
export async function fetchRawAsset(publicId: string): Promise<Response> {
  const url = client().utils.private_download_url(publicId, "", { resource_type: "raw", type: "upload" });
  return fetch(url, { cache: "no-store" });
}

export type StoredAsset = { publicId: string; createdAt: string; bytes: number; resourceType: ResourceType };

/** Lists every asset stored under this site's media folder. */
export async function listAssets(resourceType: ResourceType): Promise<StoredAsset[]> {
  const api = client();
  const assets: StoredAsset[] = [];
  let cursor: string | undefined;
  do {
    const page = (await api.api.resources({
      type: "upload",
      resource_type: resourceType,
      prefix: `${mediaRoot()}/`,
      max_results: 500,
      next_cursor: cursor,
    })) as {
      resources: { public_id: string; created_at: string; bytes: number }[];
      next_cursor?: string;
    };
    for (const r of page.resources) {
      assets.push({ publicId: r.public_id, createdAt: r.created_at, bytes: r.bytes, resourceType });
    }
    cursor = page.next_cursor;
  } while (cursor);
  return assets;
}
