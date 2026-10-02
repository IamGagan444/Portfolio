import "server-only";

import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { requireAdminApi } from "@/lib/auth/guard";

import { ApiError } from "./errors";
import type { ApiFailure, ApiSuccess } from "./types";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, init);
}

export function fail(status: number, message: string, errors?: Record<string, string>) {
  return NextResponse.json<ApiFailure>(
    { success: false, message, ...(errors ? { errors } : {}) },
    { status },
  );
}

export function zodErrors(error: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    out[key] ??= issue.message;
  }
  return out;
}

/** Maps any thrown value to a safe structured response. Internals are logged, never returned. */
export function toErrorResponse(error: unknown) {
  if (error instanceof ApiError) return fail(error.status, error.message, error.errors);
  if (error instanceof ZodError) return fail(422, "Validation failed", zodErrors(error));
  if (error instanceof mongoose.Error.CastError) return fail(400, "Invalid identifier");
  if (error instanceof mongoose.Error.ValidationError) return fail(422, "Validation failed");
  if (isDuplicateKeyError(error)) {
    const field = Object.keys(error.keyValue ?? {})[0];
    return fail(
      409,
      field ? `A record with this ${field} already exists` : "Duplicate record",
      field ? { [field]: `This ${field} is already in use` } : undefined,
    );
  }
  console.error("[api] Unhandled error:", error);
  return fail(500, "Something went wrong. Please try again.");
}

function isDuplicateKeyError(
  error: unknown,
): error is { code: number; keyValue?: Record<string, unknown> } {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/**
 * CSRF defence for cookie-authenticated mutations: the request must originate
 * from this site. Browsers always send `Origin` on cross-site POST/PATCH/DELETE.
 */
function assertSameOrigin(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return;
  const origin = req.headers.get("origin");
  const fetchSite = req.headers.get("sec-fetch-site");
  if (origin) {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    let originHost: string | null = null;
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = null;
    }
    if (!host || originHost !== host) throw new ApiError(403, "Cross-site request blocked");
    return;
  }
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") {
    throw new ApiError(403, "Cross-site request blocked");
  }
}

type RouteContext<P> = { params: Promise<P> };

/**
 * Wraps an admin route handler with origin checks, server-side authorization
 * and consistent error handling. Every `/api/admin/*` handler goes through this.
 */
export function adminRoute<P = Record<string, never>>(
  handler: (req: NextRequest, params: P) => Promise<Response>,
) {
  return async (req: NextRequest, ctx: RouteContext<P>) => {
    try {
      assertSameOrigin(req);
      await requireAdminApi();
      return await handler(req, await ctx.params);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

const MAX_JSON_BYTES = 1_000_000;

/** Reads and validates a JSON body against a Zod schema. */
export async function parseJson<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.output<S>> {
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_JSON_BYTES) throw new ApiError(413, "Request body too large");
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}
