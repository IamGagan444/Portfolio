import "server-only";

import { isValidObjectId } from "mongoose";
import { redirect } from "next/navigation";
import { cache } from "react";

import { ApiError } from "@/lib/api/errors";
import { connectDB } from "@/lib/db/connect";
import { AdminUser } from "@/models/AdminUser";

import { auth } from "./index";

export type AdminIdentity = { id: string; email: string; name: string };

/**
 * Authoritative server-side session check. Beyond verifying the signed JWT it
 * confirms the admin still exists and the session predates no password change.
 * Memoised per request.
 */
export const getAdmin = cache(async (): Promise<AdminIdentity | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !isValidObjectId(id)) return null;

  await connectDB();
  const admin = await AdminUser.findById(id).select("email name authVersion").lean();
  if (!admin || admin.authVersion !== session.user.authVersion) return null;

  return { id: admin._id.toString(), email: admin.email, name: admin.name };
});

export async function requireAdminPage(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export async function requireAdminApi(): Promise<AdminIdentity> {
  const admin = await getAdmin();
  if (!admin) throw new ApiError(401, "Unauthorized");
  return admin;
}
