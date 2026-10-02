import type { NextAuthConfig } from "next-auth";

const SESSION_MAX_AGE = 60 * 60 * 8; // 8 hours

/**
 * Database-free Auth.js configuration. Shared by the proxy (route gating) and
 * the full server config in `./index.ts`, which adds the credentials provider.
 */
export const authConfig = {
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE, updateAge: 60 * 30 },
  trustHost: true,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user?.id);
      const { pathname } = nextUrl;

      if (pathname.startsWith("/api/admin")) {
        return isLoggedIn
          ? true
          : Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
      }
      // The login page itself decides whether a session is still valid (it may
      // have been revoked by a password change), so never redirect it here.
      if (pathname === "/admin/login") return true;
      // Returning false redirects to the sign-in page with a callbackUrl.
      return isLoggedIn;
    },
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.authVersion = user.authVersion;
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.authVersion = typeof token.authVersion === "number" ? token.authVersion : -1;
      return session;
    },
  },
} satisfies NextAuthConfig;
