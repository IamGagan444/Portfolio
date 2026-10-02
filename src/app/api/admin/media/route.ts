import { adminRoute, ok } from "@/lib/api/handler";
import { destroyMedia, listAssets, type StoredAsset } from "@/lib/cloudinary";
import { referencedPublicIds } from "@/lib/media";

// Uploads younger than this may belong to a form that hasn't been saved yet.
const GRACE_PERIOD_MS = 60 * 60 * 1000;

async function findUnused(): Promise<StoredAsset[]> {
  const [images, raw, referenced] = await Promise.all([
    listAssets("image"),
    listAssets("raw"),
    referencedPublicIds(),
  ]);
  const cutoff = Date.now() - GRACE_PERIOD_MS;
  return [...images, ...raw].filter(
    (asset) => !referenced.has(asset.publicId) && new Date(asset.createdAt).getTime() < cutoff,
  );
}

/** Lists stored files that no record references (e.g. from abandoned forms). */
export const GET = adminRoute(async () => {
  const unused = await findUnused();
  return ok({ count: unused.length, bytes: unused.reduce((sum, a) => sum + a.bytes, 0), assets: unused });
});

/** Deletes every unused stored file. */
export const DELETE = adminRoute(async () => {
  const unused = await findUnused();
  await Promise.all([
    destroyMedia(unused.filter((a) => a.resourceType === "image").map((a) => a.publicId), "image"),
    destroyMedia(unused.filter((a) => a.resourceType === "raw").map((a) => a.publicId), "raw"),
  ]);
  return ok({ deleted: unused.length });
});
