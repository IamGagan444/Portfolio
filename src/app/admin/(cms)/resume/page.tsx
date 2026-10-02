import type { Metadata } from "next";

import { ResumeManager } from "@/components/admin/resume-manager";

export const metadata: Metadata = { title: "Resume" };

export default function ResumePage() {
  return <ResumeManager />;
}
