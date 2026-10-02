import type { Metadata } from "next";

import { ExperienceManager } from "@/components/admin/managers";

export const metadata: Metadata = { title: "Experience" };

export default function ExperiencePage() {
  return <ExperienceManager />;
}
