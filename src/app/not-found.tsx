import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[80dvh] max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">404</p>
      <h1 className="text-3xl font-bold tracking-tighter">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
        Back home
      </Link>
    </main>
  );
}
