"use server";

import { AuthError, CredentialsSignin } from "next-auth";

import { signIn } from "@/lib/auth";
import { type LoginInput, loginSchema } from "@/lib/validations/auth";

export type LoginResult = { error: string } | undefined;

/** Only allow redirects back into the admin area of this site. */
function safeCallback(url: string | undefined) {
  if (url && url.startsWith("/admin") && !url.startsWith("//") && !url.startsWith("/admin/login")) return url;
  return "/admin/dashboard";
}

export async function loginAction(input: LoginInput, callbackUrl?: string): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email and password." };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: safeCallback(callbackUrl) });
  } catch (error) {
    if (error instanceof CredentialsSignin && error.code === "rate_limited") {
      return { error: "Too many sign-in attempts. Please wait 15 minutes and try again." };
    }
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    // Redirects are thrown as errors and must propagate.
    throw error;
  }
}
