import bcrypt from "bcryptjs";

import { ApiError } from "@/lib/api/errors";
import { adminRoute, ok, parseJson } from "@/lib/api/handler";
import { requireAdminApi } from "@/lib/auth/guard";
import { connectDB } from "@/lib/db/connect";
import { consumeRateLimit } from "@/lib/rate-limit";
import { changePasswordSchema } from "@/lib/validations/auth";
import { AdminUser } from "@/models";

/**
 * Changes the admin password. Bumping `authVersion` signs out every session,
 * including this one, so the client must sign in again.
 */
export const PATCH = adminRoute(async (req) => {
  const admin = await requireAdminApi();
  const limit = await consumeRateLimit(`password:${admin.id}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) throw new ApiError(429, "Too many attempts. Try again later.");

  const input = await parseJson(req, changePasswordSchema);
  await connectDB();
  const user = await AdminUser.findById(admin.id).select("+passwordHash").lean();
  if (!user) throw new ApiError(401, "Unauthorized");

  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) {
    throw new ApiError(400, "Current password is incorrect", {
      currentPassword: "Current password is incorrect",
    });
  }

  await AdminUser.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await bcrypt.hash(input.newPassword, 12) }, $inc: { authVersion: 1 } },
  );
  return ok({ signedOut: true });
});
