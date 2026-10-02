import "server-only";

import { connectDB } from "@/lib/db/connect";
import { RateLimit } from "@/models/RateLimit";

type RateLimitResult = { allowed: boolean; remaining: number; retryAfterSeconds: number };

/**
 * Fixed-window rate limiter backed by MongoDB, so limits hold across every
 * serverless instance. Expired windows are removed by a TTL index.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  await connectDB();
  const now = new Date();
  const windowExpired = {
    $or: [{ $eq: [{ $type: "$expiresAt" }, "missing"] }, { $lte: ["$expiresAt", now] }],
  };

  const update = [
    {
      $set: {
        key,
        count: { $cond: [windowExpired, 1, { $add: ["$count", 1] }] },
        expiresAt: { $cond: [windowExpired, new Date(now.getTime() + windowMs), "$expiresAt"] },
      },
    },
  ];

  const run = () =>
    RateLimit.collection.findOneAndUpdate({ key }, update, {
      upsert: true,
      returnDocument: "after",
    });

  let doc;
  try {
    doc = await run();
  } catch (error) {
    // Two concurrent first requests can race on the unique upsert; retry once.
    if ((error as { code?: number }).code !== 11000) throw error;
    doc = await run();
  }

  const count = (doc?.count as number | undefined) ?? 1;
  const expiresAt = (doc?.expiresAt as Date | undefined) ?? now;
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    retryAfterSeconds: Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000)),
  };
}

export async function resetRateLimit(key: string) {
  await connectDB();
  await RateLimit.deleteOne({ key });
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
