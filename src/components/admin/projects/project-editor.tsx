"use client";

import { useMemo } from "react";

import type { ProjectDTO } from "@/lib/validations/portfolio";

import { useResourceItem, useResourceList } from "../hooks/use-resource";
import { PageHeader } from "../page-header";
import { ErrorState, ListSkeleton } from "../states";
import { ProjectForm } from "./project-form";

/** Loads project + list data (for category/technology suggestions) and renders the form. */
export function ProjectEditor({ id }: { id: string | null }) {
  const list = useResourceList<ProjectDTO>("projects");
  const item = useResourceItem<ProjectDTO>("projects", id ?? "");

  const { categories, technologies } = useMemo(() => {
    const projects = list.data ?? [];
    return {
      categories: [...new Set(projects.map((p) => p.category).filter(Boolean))].sort(),
      technologies: [...new Set(projects.flatMap((p) => p.technologies))].sort(),
    };
  }, [list.data]);

  if (id && item.isPending) return <ListSkeleton rows={4} />;
  if (id && item.isError) return <ErrorState message={item.error.message} onRetry={() => item.refetch()} />;

  const project = id ? (item.data ?? null) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title={project ? project.title : "New project"}
        description={project ? `/projects/${project.slug}` : "Fill in the details, then publish when ready."}
      />
      <ProjectForm
        key={project?.updatedAt ?? "new"}
        project={project}
        categories={categories}
        technologySuggestions={technologies}
      />
    </div>
  );
}
