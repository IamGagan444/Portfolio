/**
 * Seeds the database with the portfolio's original content.
 *
 *   npm run seed           Fill only collections that are empty (safe to re-run).
 *   npm run seed -- --force Replace all portfolio content with the seed data.
 */
import mongoose, { type Model } from "mongoose";

import { Certification } from "../src/models/Certification";
import { Education } from "../src/models/Education";
import { Experience } from "../src/models/Experience";
import { Hackathon } from "../src/models/Hackathon";
import { Profile } from "../src/models/Profile";
import { Project } from "../src/models/Project";
import { RateLimit } from "../src/models/RateLimit";
import { Resume } from "../src/models/Resume";
import { Skill } from "../src/models/Skill";
import { AdminUser } from "../src/models/AdminUser";
import { connect } from "./_env";
import * as data from "./seed-data";

const force = process.argv.includes("--force");

async function seedCollection(name: string, model: Model<never>, docs: readonly object[]) {
  if (force) await model.deleteMany({});
  const existing = await model.estimatedDocumentCount();
  if (existing > 0) {
    console.log(`• ${name}: ${existing} existing record(s), skipped`);
    return;
  }
  if (docs.length === 0) {
    console.log(`• ${name}: nothing to seed`);
    return;
  }
  await model.insertMany(docs);
  console.log(`✓ ${name}: inserted ${docs.length}`);
}

async function main() {
  await connect();
  console.log(force ? "Seeding (force: replacing existing content)…" : "Seeding empty collections…");

  // Build indexes up front (unique slug, single active resume, TTL, …).
  await Promise.all(
    [Profile, Project, Experience, Skill, Education, Certification, Hackathon, Resume, AdminUser, RateLimit].map(
      (model) => (model as Model<unknown>).syncIndexes(),
    ),
  );

  const asModel = <T>(m: Model<T>) => m as unknown as Model<never>;
  await seedCollection("profile", asModel(Profile), [data.profile]);
  // Additive backfill for profiles created before newer fields existed.
  const backfill = await Profile.updateOne(
    { $or: [{ roles: { $exists: false } }, { roles: { $size: 0 } }, { heroImages: { $exists: false } }, { heroImages: { $size: 0 } }] },
    [
      {
        $set: {
          roles: { $cond: [{ $gt: [{ $size: { $ifNull: ["$roles", []] } }, 0] }, "$roles", data.profile.roles] },
          heroImages: {
            $cond: [{ $gt: [{ $size: { $ifNull: ["$heroImages", []] } }, 0] }, "$heroImages", data.profile.heroImages],
          },
        },
      },
    ],
    { updatePipeline: true },
  );
  if (backfill.modifiedCount) console.log("✓ profile: added roles/hero images");
  await seedCollection("projects", asModel(Project), data.projects);
  await seedCollection("experience", asModel(Experience), data.experience);
  await seedCollection("skills", asModel(Skill), data.skills);
  await seedCollection("education", asModel(Education), data.education);
  await seedCollection("certifications", asModel(Certification), data.certifications);
  await seedCollection("hackathons", asModel(Hackathon), data.hackathons);

  console.log("\nDone. Create an admin account with `npm run create-admin` if you haven't yet.");
  console.log(
    "If the site was already running, open /admin/settings → “Refresh all public pages” " +
      "(the seed runs outside Next.js and can't clear its page cache).",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
