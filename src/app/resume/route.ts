import { getActiveResume } from "@/lib/data/portfolio";
import { resumeFileResponse } from "@/lib/resume";

/**
 * Stable public link to the current resume (`/resume`). Always serves the
 * active version, so shared links never go stale after an update.
 * `?download=1` downloads instead of opening in the browser.
 */
export async function GET(request: Request) {
  const resume = await getActiveResume();
  if (!resume) {
    return new Response("Resume not available", { status: 404, headers: { "Content-Type": "text/plain" } });
  }
  const download = new URL(request.url).searchParams.get("download") === "1";
  return resumeFileResponse(resume, { download });
}
