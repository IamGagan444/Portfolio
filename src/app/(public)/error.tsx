"use client";

import { Button } from "@/components/ui/button";

export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold tracking-tighter">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page couldn&apos;t be loaded right now. Please try again in a moment.
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </main>
  );
}
