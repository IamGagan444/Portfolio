import { adminRoute, ok, parseJson } from "@/lib/api/handler";
import { invalidate, TAGS } from "@/lib/cache";
import { connectDB } from "@/lib/db/connect";
import { profileDTO } from "@/lib/db/dto";
import { destroyIfUnreferenced, publicIdsOf } from "@/lib/media";
import { profileSchema } from "@/lib/validations/portfolio";
import { Profile } from "@/models";

export const GET = adminRoute(async () => {
  await connectDB();
  const doc = await Profile.findOne().lean();
  return ok(doc ? profileDTO(doc) : null);
});

/** Creates or updates the single profile document. */
export const PATCH = adminRoute(async (req) => {
  const input = await parseJson(req, profileSchema);
  await connectDB();
  const previous = await Profile.findOne().select("profileImage heroImages").lean();
  const updated = await Profile.findOneAndUpdate(
    { singleton: "profile" },
    { $set: input },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  const oldImage = publicIdsOf(previous?.profileImage, previous?.heroImages ?? []);
  const newImage = new Set(publicIdsOf(updated?.profileImage, updated?.heroImages ?? []));
  await destroyIfUnreferenced(oldImage.filter((pid) => !newImage.has(pid)));

  invalidate(TAGS.profile);
  return ok(profileDTO(updated));
});
