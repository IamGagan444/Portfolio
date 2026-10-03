import "server-only";

import mongoose from "mongoose";

import { fetchRawAsset } from "@/lib/cloudinary";
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

type ResumeFile = { publicId?: string; fileUrl: string; fileName: string };

/**
 * Streams a resume PDF from storage through this server, so links work
 * regardless of the storage provider's delivery restrictions.
 */
export async function resumeFileResponse(resume: ResumeFile, { download = false } = {}): Promise<Response> {
  const upstream = resume.publicId ? await fetchRawAsset(resume.publicId) : await fetch(resume.fileUrl, { cache: "no-store" });
  if (!upstream.ok || !upstream.body) {
    console.error(`[resume] Storage returned ${upstream.status} for ${resume.publicId || resume.fileUrl}`);
    return new Response("Resume is temporarily unavailable", { status: 502, headers: { "Content-Type": "text/plain" } });
  }
  const name = resume.fileName.replace(/[^\w.\- ]+/g, "") || "resume.pdf";
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name}"`,
      ...(upstream.headers.get("content-length") ? { "Content-Length": upstream.headers.get("content-length")! } : {}),
      // Always revalidate so a newly activated resume is served immediately.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
