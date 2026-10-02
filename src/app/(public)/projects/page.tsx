import { ProjectTile } from "@/components/portfolio/project-tile";
import { Container, SectionHeading } from "@/components/portfolio/section";
import { getPublishedProjects } from "@/lib/data/portfolio";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
  description: "Everything I've built — web apps, tools and experiments.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getPublishedProjects();

  return (
    <main className="relative pb-24 pt-32 sm:pt-40">
      <div aria-hidden className="absolute inset-x-0 top-0 h-[28rem] bg-grid mask-radial opacity-60" />
      <Container className="relative">
        <SectionHeading
          index="~"
          label="archive"
          title="All projects."
          description={`${projects.length} project${projects.length === 1 ? "" : "s"}, in the order I'd show you.`}
        />
        {projects.length === 0 ? (
          <p className="font-mono text-sm text-muted-foreground">No projects published yet.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project, i) => (
              <ProjectTile key={project.id} project={project} index={i} wide={false} />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
