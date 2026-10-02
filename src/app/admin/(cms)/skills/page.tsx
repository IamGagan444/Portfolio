import type { Metadata } from "next";

import { SkillsManager } from "@/components/admin/managers";

export const metadata: Metadata = { title: "Skills" };

export default function SkillsPage() {
  return <SkillsManager />;
}
