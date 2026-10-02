import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    authVersion: number;
  }

  interface Session {
    user: {
      id: string;
      authVersion: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    authVersion?: number;
  }
}
