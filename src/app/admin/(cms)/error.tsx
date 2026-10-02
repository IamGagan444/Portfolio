"use client";

import { ErrorState } from "@/components/admin/states";

export default function CmsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState message="This page failed to load. Please try again." onRetry={reset} />;
}
