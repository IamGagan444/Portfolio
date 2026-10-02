import { ApiError, notFound } from "@/lib/api/errors";
import { adminRoute, ok, parseJson } from "@/lib/api/handler";
import { invalidate, TAGS } from "@/lib/cache";
import { destroyMedia } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db/connect";
import { toDTO } from "@/lib/db/dto";
import { objectId } from "@/lib/validations/common";
import { type ResumeDTO, resumePatchSchema } from "@/lib/validations/portfolio";
import { Resume } from "@/models";

import { activateResume } from "@/lib/resume";

type Params = { id: string };

function parseId(id: string) {
  if (!objectId.safeParse(id).success) throw new ApiError(400, "Invalid identifier");
  return id;
}

/** Renames a resume and/or marks it as the active version. */
export const PATCH = adminRoute<Params>(async (req, { id }) => {
  const safeId = parseId(id);
  const input = await parseJson(req, resumePatchSchema);
  await connectDB();
  if (!(await Resume.exists({ _id: safeId }))) throw notFound("Resume");

  if (input.title) await Resume.updateOne({ _id: safeId }, { $set: { title: input.title } });
  if (input.isActive) await activateResume(safeId);

  invalidate(TAGS.resume);
  const doc = await Resume.findById(safeId).lean();
  return ok(toDTO<ResumeDTO>(doc));
});

/** Deletes an inactive resume version and its stored file. */
export const DELETE = adminRoute<Params>(async (_req, { id }) => {
  const safeId = parseId(id);
  await connectDB();
  const doc = await Resume.findById(safeId).lean();
  if (!doc) throw notFound("Resume");
  if (doc.isActive) {
    throw new ApiError(409, "The active resume can't be deleted. Activate another version first.");
  }
  await Resume.deleteOne({ _id: safeId });
  if (doc.publicId) await destroyMedia([doc.publicId], "raw");
  invalidate(TAGS.resume);
  return ok({ id: safeId });
});
