import { ApiError, notFound } from "@/lib/api/errors";
import { adminRoute } from "@/lib/api/handler";
import { connectDB } from "@/lib/db/connect";
import { resumeFileResponse } from "@/lib/resume";
import { objectId } from "@/lib/validations/common";
import { Resume } from "@/models";

/** Admin preview/download of any resume version (including inactive ones). */
export const GET = adminRoute<{ id: string }>(async (req, { id }) => {
  if (!objectId.safeParse(id).success) throw new ApiError(400, "Invalid identifier");
  await connectDB();
  const resume = await Resume.findById(id).select("publicId fileUrl fileName").lean();
  if (!resume) throw notFound("Resume");
  const response = await resumeFileResponse(resume, { download: req.nextUrl.searchParams.get("download") === "1" });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
});
