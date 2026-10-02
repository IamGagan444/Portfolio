import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectEditor } from "@/components/admin/projects/project-editor";
import { objectId } from "@/lib/validations/common";

export const metadata: Metadata = { title: "Edit project" };

type Props = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;
  if (!objectId.safeParse(id).success) notFound();
  return <ProjectEditor id={id} />;
}
