import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAdmin } from "@/lib/auth/guard";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  if (await getAdmin()) redirect("/admin/dashboard");
  const { callbackUrl } = await searchParams;

  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_top,hsl(var(--foreground)/0.06),transparent_70%)]"
      />
      <div className="relative w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="flex size-9 items-center justify-center rounded-lg bg-foreground font-mono text-sm font-semibold text-background">
            P
          </span>
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">Sign in to Portfolio CMS</h1>
            <p className="text-sm text-muted-foreground">Manage the content of your public portfolio.</p>
          </div>
        </div>
        <div className="rounded-xl border bg-background p-6 shadow-[0_0_0_1px_rgba(0,0,0,.02),0_2px_4px_rgba(0,0,0,.04),0_12px_24px_rgba(0,0,0,.04)]">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <p className="text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          Authorized access only
        </p>
      </div>
    </main>
  );
}
