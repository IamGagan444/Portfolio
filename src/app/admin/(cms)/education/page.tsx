import type { Metadata } from "next";

import { EducationManager } from "@/components/admin/managers";

export const metadata: Metadata = { title: "Education" };

export default function EducationPage() {
  return <EducationManager />;
}
