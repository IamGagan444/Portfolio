import type { ProfileDTO } from "@/lib/validations/portfolio";

import { serialize } from "./serialize";

/**
 * Converts a lean document into the shape the API and UI work with: a
 * serialized object whose empty date fields are `""` (matching form inputs)
 * rather than `null`.
 */
export function toDTO<T>(doc: unknown, dateFields: readonly string[] = []): T {
  const out = serialize(doc) as Record<string, unknown>;
  for (const field of dateFields) {
    if (out[field] === null || out[field] === undefined) out[field] = "";
  }
  return out as T;
}

/** Converts `""`/date-string fields into `Date | null` for persistence. */
export function toDates<T extends Record<string, unknown>>(
  input: T,
  dateFields: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...input };
  for (const field of dateFields) {
    if (!(field in out)) continue;
    const value = out[field];
    out[field] = typeof value === "string" && value ? new Date(value) : null;
  }
  return out;
}

/** Profile DTO with defaults for fields older documents may lack. */
export function profileDTO(doc: unknown): ProfileDTO {
  const dto = toDTO<Partial<ProfileDTO>>(doc);
  return {
    ...dto,
    roles: dto.roles ?? [],
    heroImages: dto.heroImages ?? [],
    latitude: dto.latitude ?? null,
    longitude: dto.longitude ?? null,
    timezone: dto.timezone ?? "",
  } as ProfileDTO;
}
