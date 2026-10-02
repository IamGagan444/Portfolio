import { z } from "zod";

export const requiredText = (label: string, max = 200) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

export const optionalText = (max = 200) =>
  z.string().trim().max(max, `Must be at most ${max} characters`);

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Absolute http(s) URL. Rejects `javascript:`, `data:` and other schemes. */
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(isHttpUrl, "Must be a valid http(s) URL");

export const optionalUrl = z.union([z.literal(""), httpUrl]);

/** http(s) URL, `mailto:` link, or same-site path. Used for social links. */
export const linkUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) =>
      isHttpUrl(v) ||
      /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(v) ||
      (v.startsWith("/") && !v.startsWith("//")),
    "Must be a valid URL, mailto: link, or path",
  );

/** http(s) URL or a same-site path such as `/me.jpeg` (served from /public). */
export const assetUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (v) => isHttpUrl(v) || (v.startsWith("/") && !v.startsWith("//")),
    "Must be a valid URL or a path starting with /",
  );

export const optionalAssetUrl = z.union([z.literal(""), assetUrl]);

/** A stored media file. `publicId` is set for Cloudinary uploads, empty for external/static files. */
export const mediaSchema = z.strictObject({
  url: assetUrl,
  publicId: z.string().trim().max(300),
  alt: optionalText(200).optional(),
});

export type Media = z.infer<typeof mediaSchema>;

const DATE_RE = /^\d{4}-\d{2}(-\d{2}(T[\d:.]+(Z|[+-]\d{2}:\d{2})?)?)?$/;

/** `YYYY-MM`, `YYYY-MM-DD` or a full ISO timestamp. */
export const dateString = z
  .string()
  .trim()
  .regex(DATE_RE, "Invalid date")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Invalid date");

export const optionalDate = z.union([z.literal(""), dateString]);

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const tagList = z
  .array(z.string().trim().min(1).max(50, "Tags must be at most 50 characters"))
  .max(50, "At most 50 items");

export const reorderSchema = z.strictObject({
  ids: z
    .array(objectId)
    .min(1)
    .max(500)
    .refine((ids) => new Set(ids).size === ids.length, "Duplicate ids"),
});

/** Adds an end-after-start check to objects with `startDate`/`endDate` fields. */
export function endAfterStart(
  value: { startDate?: string; endDate?: string },
  ctx: z.RefinementCtx,
) {
  if (value.startDate && value.endDate && new Date(value.endDate) < new Date(value.startDate)) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must be after start date",
    });
  }
}

/** Fields every ordered, timestamped record exposes to clients. */
export type RecordMeta = {
  id: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};
