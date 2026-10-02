import "server-only";

import mongoose from "mongoose";

import { env } from "@/lib/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Cache the connection on globalThis so hot reloads in development and warm
// serverless invocations in production reuse a single connection pool.
const globalForMongoose = globalThis as typeof globalThis & {
  __mongoose?: MongooseCache;
};

const cached: MongooseCache =
  globalForMongoose.__mongoose ?? (globalForMongoose.__mongoose = { conn: null, promise: null });

mongoose.set("strictQuery", true);
// Neutralises `$`-prefixed operators smuggled into query filters. Code that
// intentionally builds operators wraps them in `mongoose.trusted()`.
mongoose.set("sanitizeFilter", true);

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(env.mongodbUri, {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10_000,
      })
      .catch((error: unknown) => {
        // Reset so the next request retries instead of reusing a rejected promise.
        cached.promise = null;
        throw error;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
