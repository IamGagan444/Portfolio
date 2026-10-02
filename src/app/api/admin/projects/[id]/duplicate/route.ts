import { ApiError, notFound } from "@/lib/api/errors";
import { adminRoute, ok } from "@/lib/api/handler";
import { invalidate, TAGS } from "@/lib/cache";
import { connectDB } from "@/lib/db/connect";
import { toDTO } from "@/lib/db/dto";
import { uniqueProjectSlug } from "@/lib/resources";
import { objectId } from "@/lib/validations/common";
import { Project } from "@/models";

/** Creates a draft copy of a project directly below the original. */
export const POST = adminRoute<{ id: string }>(async (_req, { id }) => {
  if (!objectId.safeParse(id).success) throw new ApiError(400, "Invalid identifier");
  await connectDB();
  const source = await Project.findById(id).lean();
  if (!source) throw notFound("Project");

  const { _id, createdAt, updatedAt, ...rest } = source;
  void _id;
  void createdAt;
  void updatedAt;

  const copy = await Project.create({
    ...rest,
    title: `${source.title} (Copy)`.slice(0, 120),
    slug: await uniqueProjectSlug(`${source.slug}-copy`),
    featured: false,
    status: "draft",
    order: source.order,
  });

  invalidate(TAGS.projects);
  return ok(toDTO(copy.toObject(), ["startDate", "endDate"]), { status: 201 });
});
