import "server-only";

import bcrypt from "bcryptjs";
import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { connectDB } from "@/lib/db/connect";
import { consumeRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";
import { AdminUser } from "@/models/AdminUser";

import { authConfig } from "./config";

export class RateLimitedError extends CredentialsSignin {
  code = "rate_limited";
}

const WINDOW_MS = 15 * 60 * 1000;
// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = "$2b$12$rTefqz6LHW5iZgR4X/SSJOccz99kiQiI2IBEeRmvvI/PTggU2iAne";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        // Auth.js also passes csrfToken/callbackUrl; validate only the credentials.
        const parsed = loginSchema.safeParse({ email: raw?.email, password: raw?.password });
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const ip = getClientIp(request.headers);
        const [byIp, byEmail] = await Promise.all([
          consumeRateLimit(`login:ip:${ip}`, 20, WINDOW_MS),
          consumeRateLimit(`login:email:${email}`, 5, WINDOW_MS),
        ]);
        if (!byIp.allowed || !byEmail.allowed) throw new RateLimitedError();

        await connectDB();
        const user = await AdminUser.findOne({ email }).select("+passwordHash").lean();
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
        if (!user || !valid) return null;

        await Promise.all([
          resetRateLimit(`login:email:${email}`),
          AdminUser.updateOne({ _id: user._id }, { lastLoginAt: new Date() }),
        ]);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          authVersion: user.authVersion,
        };
      },
    }),
  ],
});
