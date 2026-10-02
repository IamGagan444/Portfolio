import "server-only";

import mongoose, { type Model } from "mongoose";
import type { NextRequest } from "next/server";
import type { z } from "zod";

import { type CacheTag, invalidate } from "@/lib/cache";
import { connectDB } from "@/lib/db/connect";
import { toDates, toDTO } from "@/lib/db/dto";
import { destroyIfUnreferenced } from "@/lib/media";
import { objectId, reorderSchema } from "@/lib/validations/common";

import { ApiError, notFound } from "./errors";
import { adminRoute, ok, parseJson } from "./handler";

type Data = Record<string, unknown>;

export type ResourceConfig<Doc> = {
  /** Human-readable singular name, used in error messages. */
  label: string;
  model: Model<Doc>;
  createSchema: z.ZodType<Data>;
  patchSchema: z.ZodType<Data>;
  tags: CacheTag[];
  dateFields: readonly string[];
  /** Fields matched (case-insensitively) by the `q` search parameter. */
  searchFields: readonly string[];
  /** Maps query-string filters to exact-match conditions. */
  filters?: Record<string, (value: string) => Data | null>;
  /** Cloudinary public ids owned by a document, for cleanup on change/delete. */
  mediaOf: (doc: Data) => string[];
  /** Resource-specific normalisation before persisting (slugs, derived fields…). */
  prepare?: (data: Data, ctx: { id?: string; existing?: Data }) => Promise<Data> | Data;
};

const MAX_LIMIT = 200;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseId(id: string) {
  const parsed = objectId.safeParse(id);
  if (!parsed.success) throw new ApiError(400, "Invalid identifier");
  return parsed.data;
}

async function nextTopOrder(model: Model<unknown>) {
  const first = await model.findOne().sort({ order: 1 }).select("order").lean<{ order?: number }>();
  return (first?.order ?? 1) - 1;
}

/** Builds GET (list) + POST handlers for `/api/admin/<resource>`. */
export function collectionHandlers<Doc>(config: ResourceConfig<Doc>) {
  const model = config.model as unknown as Model<unknown>;

  const GET = adminRoute(async (req: NextRequest) => {
    await connectDB();
    const params = req.nextUrl.searchParams;
    const filter: Data = {};

    const q = params.get("q")?.trim().slice(0, 100);
    if (q && config.searchFields.length > 0) {
      const pattern = new RegExp(escapeRegex(q), "i");
      filter.$or = mongoose.trusted(config.searchFields.map((field) => ({ [field]: { $regex: pattern } })));
    }
    for (const [param, toFilter] of Object.entries(config.filters ?? {})) {
      const value = params.get(param);
      if (value) Object.assign(filter, toFilter(value) ?? {});
    }

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(params.get("limit")) || MAX_LIMIT));
    const page = Math.max(1, Number(params.get("page")) || 1);

    const [docs, total] = await Promise.all([
      model.find(filter).sort({ order: 1, createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      model.countDocuments(filter),
    ]);

    return ok({
      items: docs.map((d) => toDTO(d, config.dateFields)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    });
  });

  const POST = adminRoute(async (req: NextRequest) => {
    const input = await parseJson(req, config.createSchema);
    await connectDB();
    let data = toDates(input, config.dateFields);
    if (config.prepare) data = await config.prepare(data, {});
    const created = await model.create({ ...data, order: await nextTopOrder(model) });
    invalidate(...config.tags);
    return ok(toDTO(created.toObject(), config.dateFields), { status: 201 });
  });

  return { GET, POST };
}

/** Builds GET + PATCH + DELETE handlers for `/api/admin/<resource>/[id]`. */
export function itemHandlers<Doc>(config: ResourceConfig<Doc>) {
  const model = config.model as unknown as Model<unknown>;
  type Params = { id: string };

  const GET = adminRoute<Params>(async (_req, { id }) => {
    await connectDB();
    const doc = await model.findById(parseId(id)).lean();
    if (!doc) throw notFound(config.label);
    return ok(toDTO(doc, config.dateFields));
  });

  const PATCH = adminRoute<Params>(async (req, { id }) => {
    const safeId = parseId(id);
    const input = await parseJson(req, config.patchSchema);
    await connectDB();
    const existing = await model.findById(safeId).lean<Data>();
    if (!existing) throw notFound(config.label);

    let data = toDates(input, config.dateFields);
    if (config.prepare) data = await config.prepare(data, { id: safeId, existing });

    const updated = await model
      .findByIdAndUpdate(safeId, { $set: data }, { new: true, runValidators: true })
      .lean<Data>();
    if (!updated) throw notFound(config.label);

    const kept = new Set(config.mediaOf(updated));
    await destroyIfUnreferenced(config.mediaOf(existing).filter((pid) => !kept.has(pid)));
    invalidate(...config.tags);
    return ok(toDTO(updated, config.dateFields));
  });

  const DELETE = adminRoute<Params>(async (_req, { id }) => {
    await connectDB();
    const deleted = await model.findByIdAndDelete(parseId(id)).lean<Data>();
    if (!deleted) throw notFound(config.label);
    await destroyIfUnreferenced(config.mediaOf(deleted));
    invalidate(...config.tags);
    return ok({ id });
  });

  return { GET, PATCH, DELETE };
}

/** Builds the PATCH handler for `/api/admin/<resource>/reorder`. */
export function reorderHandler<Doc>(config: ResourceConfig<Doc>) {
  const model = config.model as unknown as Model<unknown>;

  return adminRoute(async (req: NextRequest) => {
    const { ids } = await parseJson(req, reorderSchema);
    await connectDB();
    const total = await model.countDocuments();
    const matching = await model.countDocuments({ _id: mongoose.trusted({ $in: ids }) });
    if (total !== ids.length || matching !== ids.length) {
      throw new ApiError(409, "The list changed since it was loaded. Refresh and try again.");
    }
    await model.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
      })),
    );
    invalidate(...config.tags);
    return ok({ ids });
  });
}
