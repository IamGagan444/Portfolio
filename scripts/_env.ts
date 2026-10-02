import mongoose from "mongoose";

/** Loads `.env.local` then `.env` (whichever exist), like Next.js does. */
export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      // File not present — fine.
    }
  }
}

export async function connect() {
  loadEnv();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set. Add it to .env.local (see .env.example).");
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return mongoose;
}
