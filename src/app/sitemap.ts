import { getBlogPosts } from "@/data/blog";
import { getProfile, getPublishedProjects } from "@/lib/data/portfolio";
import { absoluteUrl } from "@/lib/site";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [profile, projects, posts] = await Promise.all([getProfile(), getPublishedProjects(), getBlogPosts()]);

  return [
    { url: absoluteUrl("/"), lastModified: profile?.updatedAt, changeFrequency: "monthly", priority: 1 },
    { url: absoluteUrl("/projects"), changeFrequency: "monthly", priority: 0.8 },
    ...projects.map((project) => ({
      url: absoluteUrl(`/projects/${project.slug}`),
      lastModified: project.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: absoluteUrl("/blog"), changeFrequency: "weekly", priority: 0.6 },
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.metadata.publishedAt as string | undefined,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
