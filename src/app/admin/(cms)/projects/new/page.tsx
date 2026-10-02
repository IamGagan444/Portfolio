import type { Metadata } from "next";

import { ProjectEditor } from "@/components/admin/projects/project-editor";

export const metadata: Metadata = { title: "New project" };

export default function NewProjectPage() {
  return <ProjectEditor id={null} />;
}
