/**
 * Creates the admin account (or resets its password with --reset).
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD in the environment or
 * .env.local; if ADMIN_PASSWORD is absent you are prompted for it. Remove
 * ADMIN_PASSWORD from your env file once the account exists.
 *
 *   npm run create-admin
 *   npm run create-admin -- --reset
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { createInterface } from "node:readline";
import { Writable } from "node:stream";

import { passwordSchema } from "../src/lib/validations/auth";
import { AdminUser } from "../src/models/AdminUser";
import { connect } from "./_env";

const reset = process.argv.includes("--reset");

function prompt(question: string, hidden = false): Promise<string> {
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding as BufferEncoding);
      callback();
    },
  });
  const rl = createInterface({ input: process.stdin, output, terminal: true });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer.trim());
    });
    muted = hidden;
  });
}

async function main() {
  await connect();

  const email = (process.env.ADMIN_EMAIL || (await prompt("Admin email: "))).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid email address");

  let password = process.env.ADMIN_PASSWORD ?? "";
  if (!password) {
    password = await prompt("Password (min 12 chars): ", true);
    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) throw new Error("Passwords do not match");
  }
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid password");

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await AdminUser.findOne({ email });

  if (existing && !reset) {
    console.log(`An admin with email ${email} already exists. Use --reset to change its password.`);
    return;
  }
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.authVersion += 1; // sign out existing sessions
    await existing.save();
    console.log(`✓ Password reset for ${email}. Existing sessions were signed out.`);
    return;
  }

  await AdminUser.create({ email, passwordHash, name: process.env.ADMIN_NAME || "Admin" });
  console.log(`✓ Admin account created for ${email}. Sign in at /admin/login.`);
}

main()
  .catch((error: unknown) => {
    console.error("Failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
