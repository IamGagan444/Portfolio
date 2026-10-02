import { ApiError } from "@/lib/api/errors";
import { adminRoute, ok } from "@/lib/api/handler";
import { invalidate, TAGS } from "@/lib/cache";
import { destroyMedia, uploadBuffer } from "@/lib/cloudinary";
import { connectDB } from "@/lib/db/connect";
import { toDTO } from "@/lib/db/dto";
import { RESUME_MAX_BYTES } from "@/lib/upload-limits";
import { isPdf, readFileField, readFormData, sanitizeFileName } from "@/lib/uploads";
import { type ResumeDTO, resumeUploadFieldsSchema } from "@/lib/validations/portfolio";
import { Resume } from "@/models";

import { activateResume } from "@/lib/resume";

export const GET = adminRoute(async () => {
  await connectDB();
  const docs = await Resume.find().sort({ version: -1 }).lean();
  return ok(docs.map((d) => toDTO<ResumeDTO>(d)));
});

/** Uploads a new resume version (PDF only) and optionally makes it active. */
export const POST = adminRoute(async (req) => {
  const form = await readFormData(req);
  const { file, buffer } = await readFileField(form, "file", RESUME_MAX_BYTES);
  if (!isPdf(buffer)) throw new ApiError(415, "Only PDF files are allowed", { file: "Upload a PDF" });

  const fields = resumeUploadFieldsSchema.parse({
    title: form.get("title") ?? "",
    makeActive: form.get("makeActive") ?? "false",
  });

  await connectDB();
  const latest = await Resume.findOne().sort({ version: -1 }).select("version").lean();
  const version = (latest?.version ?? 0) + 1;
  const fileName = sanitizeFileName(file.name.toLowerCase().endsWith(".pdf") ? file.name : `${file.name}.pdf`);

  const uploaded = await uploadBuffer(buffer, {
    folder: "resumes",
    resource_type: "raw",
    // Raw assets keep the extension in their public id so the URL ends in .pdf.
    public_id: `resume-v${version}-${Date.now()}.pdf`,
  });

  let created;
  try {
    created = await Resume.create({
      title: fields.title,
      fileUrl: uploaded.secure_url,
      publicId: uploaded.public_id,
      fileName,
      fileSize: file.size,
      version,
      isActive: false,
    });
  } catch (error) {
    await destroyMedia([uploaded.public_id], "raw");
    throw error;
  }

  const activeExists = await Resume.exists({ isActive: true });
  if (fields.makeActive || !activeExists) await activateResume(created._id.toString());

  invalidate(TAGS.resume);
  const fresh = await Resume.findById(created._id).lean();
  return ok(toDTO<ResumeDTO>(fresh), { status: 201 });
});
