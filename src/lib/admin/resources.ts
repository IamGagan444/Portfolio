export const RESOURCE_ENDPOINTS = {
  projects: "/api/admin/projects",
  experience: "/api/admin/experience",
  skills: "/api/admin/skills",
  education: "/api/admin/education",
  certifications: "/api/admin/certifications",
  hackathons: "/api/admin/hackathons",
} as const;

export type ResourceName = keyof typeof RESOURCE_ENDPOINTS;

export type ListResult<T> = { items: T[]; total: number; page: number; pages: number };

export const queryKeys = {
  list: (resource: ResourceName) => ["admin", resource] as const,
  item: (resource: ResourceName, id: string) => ["admin", resource, id] as const,
  profile: ["admin", "profile"] as const,
  resumes: ["admin", "resumes"] as const,
  media: ["admin", "media"] as const,
};

/** `2023-01-01T00:00:00.000Z` → `2023-01` (month inputs) or `2023-01-01` (date inputs). */
export function toInputDate(value: string | null | undefined, kind: "month" | "date"): string {
  if (!value) return "";
  return value.slice(0, kind === "month" ? 7 : 10);
}
