import "server-only";

import mongoose from "mongoose";

import { Resume } from "@/models";

/**
 * Makes one resume the active version. The previous active one is cleared
 * first because a partial unique index permits only one `isActive: true`.
 */
export async function activateResume(id: string) {
  const objectId = new mongoose.Types.ObjectId(id);
  await Resume.updateMany(
    { isActive: true, _id: mongoose.trusted({ $ne: objectId }) },
    { $set: { isActive: false } },
  );
  await Resume.updateOne({ _id: objectId }, { $set: { isActive: true } });
}
