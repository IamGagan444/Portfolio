import { Icons } from "@/components/icons";
import { formatPeriod } from "@/lib/format";
import type { ProjectDTO } from "@/lib/validations/portfolio";

export function projectLinks(project: ProjectDTO) {
  const links: { type: string; href: string; icon: React.ReactNode }[] = [];
  if (project.liveUrl) {
    links.push({ type: "Website", href: project.liveUrl, icon: <Icons.globe className="size-3" /> });
  }
  if (project.githubUrl) {
    links.push({ type: "Source", href: project.githubUrl, icon: <Icons.github className="size-3" /> });
  }
  return links;
}

/** Maps a project record onto the existing `ProjectCard` props. */
export function projectCardProps(project: ProjectDTO) {
  return {
    href: `/projects/${project.slug}`,
    title: project.title,
    description: project.shortDescription,
    dates: formatPeriod(project.startDate, project.endDate),
    tags: project.technologies,
    image: project.video ? undefined : project.thumbnail?.url,
    video: project.video || undefined,
    links: projectLinks(project),
  };
}
