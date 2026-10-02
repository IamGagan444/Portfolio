import { getActiveResume } from "@/lib/data/portfolio";

/**
 * Stable public link to the current resume (`/resume`). Redirects to whichever
 * version is active, so shared links never go stale after an update.
 */
export async function GET() {
  const resume = await getActiveResume();
  if (!resume) {
    return new Response("Resume not available", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  return new Response(null, {
    status: 307,
    headers: { Location: resume.fileUrl, "Cache-Control": "no-store" },
  });
}
