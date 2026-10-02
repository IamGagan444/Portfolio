import NextAuth from "next-auth";

import { authConfig } from "@/lib/auth/config";

const { auth } = NextAuth(authConfig);

// Optimistic gate only: verifies the session cookie (see `authorized` in the
// auth config) before admin routes run. Every admin page, API route and action
// re-authorizes server-side against the database.
export default auth;

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
